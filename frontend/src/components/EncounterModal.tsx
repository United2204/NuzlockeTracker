import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RouteWithEncounterResponse, RouteEncounterSlot, PokemonSearchResponse, CaughtPokemonResponse } from '../types/api';
import { PokemonSearch } from './PokemonSearch';
import { runsApi } from '../api/runs';
import { toShinySpriteUrl } from '../utils/sprites';

const OUTCOMES = [
  { value: 'CAPTURED',          color: 'var(--success)' },
  { value: 'FAILED',            color: 'var(--danger)' },
  { value: 'DIED_IN_ENCOUNTER', color: 'var(--danger)' },
  { value: 'NOT_FOUND',         color: 'var(--text-muted)' },
  { value: 'DEFERRED',          color: 'var(--warning)' },
];

const schema = z.object({
  outcome:  z.string().min(1, 'encounter.chooseOutcome'),
  nickname: z.string().max(50).optional(),
  shiny:    z.boolean().optional(),
  notes:    z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

export interface GuestEncounterSaveData {
  routeId: number | null;
  routeName: string;
  outcome: string;
  encounterId?: string;
  pokemon?: PokemonSearchResponse;
  nickname?: string;
  shiny?: boolean;
  notes?: string;
  swapPokemonId?: string;
}

interface Props {
  route: RouteWithEncounterResponse;
  slot: RouteEncounterSlot | null;
  runId: string;
  activePokemonCount: number;
  nicknameRequired?: boolean;
  firstEncounterOnly?: boolean;
  speciesClauseEnabled?: boolean;
  caughtChainIds?: number[];
  onClose: () => void;
  /** When provided, replaces the internal API call — used for guest mode */
  onSave?: (data: GuestEncounterSaveData) => Promise<void>;
  /** Team members to show in the swap modal — used for guest mode */
  guestTeamMembers?: CaughtPokemonResponse[];
  /** Called when the user wants to delete the captured Pokémon from this slot */
  onDelete?: () => Promise<void>;
}

const FORCED_CAPTURE_TYPES = new Set(['STARTER', 'GIFT', 'FOSSIL', 'EGG', 'TRADE']);
const TERMINAL_OUTCOMES    = new Set(['CAPTURED', 'FAILED', 'DIED_IN_ENCOUNTER', 'NOT_FOUND']);


export function EncounterModal({
  route, slot, runId, activePokemonCount,
  nicknameRequired, firstEncounterOnly, speciesClauseEnabled,
  caughtChainIds, onClose, onSave, guestTeamMembers, onDelete,
}: Props) {
  const { t } = useTranslation();
  const existingPokemon: PokemonSearchResponse | null = slot?.caughtPokemon ? {
    id:               slot.caughtPokemon.currentPokemonId,
    name:             slot.caughtPokemon.currentPokemonName,
    speciesId:        0,
    nationalDexNumber: null,
    types:            slot.caughtPokemon.currentPokemonTypes,
    spriteUrl:        slot.caughtPokemon.currentPokemonSpriteUrl,
    variant:          null,
    chainId:          slot.caughtPokemon.chainId,
  } : null;

  const isEditing = slot !== null && TERMINAL_OUTCOMES.has(slot.outcome);
  const isForced  = FORCED_CAPTURE_TYPES.has(route.encounterType);
  const isTrade   = route.encounterType === 'TRADE';

  const [selectedPokemon, setSelectedPokemon]     = useState<PokemonSearchResponse | null>(existingPokemon);
  const [tradeAwayPokemon, setTradeAwayPokemon]   = useState<CaughtPokemonResponse | null>(null);
  const [submitError, setSubmitError]             = useState('');
  const [pendingData, setPendingData]             = useState<FormData | null>(null);
  const [memberToBox, setMemberToBox]             = useState<CaughtPokemonResponse | null>(null);
  const [isDeleting, setIsDeleting]               = useState(false);
  const qc = useQueryClient();

  const teamFull        = activePokemonCount >= 6;
  const speciesConflict = speciesClauseEnabled &&
    selectedPokemon?.chainId != null &&
    (caughtChainIds?.includes(selectedPokemon.chainId) ?? false);
  const showSwapModal   = pendingData !== null;

  // API team query — reused for swap modal and TRADE give-away selector
  const { data: apiTeamMembers = [] } = useQuery({
    queryKey: ['runs', runId, 'team'],
    queryFn:  () => runsApi.team(runId).then(r => r.data),
    enabled:  (showSwapModal || isTrade) && !onSave,
  });
  // Box query — needed only for TRADE give-away (can give away a boxed Pokémon)
  const { data: tradeBoxMembers = [] } = useQuery({
    queryKey: ['runs', runId, 'box'],
    queryFn:  () => runsApi.box(runId).then(r => r.data),
    enabled:  isTrade && !onSave && !isEditing,
  });

  const teamMembers     = guestTeamMembers ?? apiTeamMembers;
  const tradeCandidates = isTrade ? [...apiTeamMembers, ...tradeBoxMembers] : [];

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      shiny:   slot?.caughtPokemon?.shiny ?? false,
      outcome: isForced ? 'CAPTURED' : (isEditing ? slot!.outcome : ''),
      notes:   slot?.notes ?? '',
      nickname: slot?.caughtPokemon?.nickname ?? '',
    },
  });

  const outcome     = watch('outcome');
  const needsPokemon = outcome === 'CAPTURED';

  async function doSubmit(data: FormData, swap: CaughtPokemonResponse | null | 'box') {
    try {
      if (onSave) {
        await onSave({
          routeId:     route.routeId,
          routeName:   route.routeName,
          outcome:     data.outcome,
          encounterId: slot?.id,
          pokemon:     selectedPokemon ?? undefined,
          nickname:    data.nickname || undefined,
          shiny:       data.shiny,
          notes:       data.notes || undefined,
          swapPokemonId: swap && swap !== 'box' ? swap.id : undefined,
        });
      } else {
        if (swap && swap !== 'box') {
          await runsApi.updatePokemonStatus(runId, swap.id, { status: 'BOXED' });
        }
        // For trades: record the received Pokémon first, then remove the given-away one
        await runsApi.recordEncounter(runId, {
          routeId:     route.routeId,
          outcome:     data.outcome,
          encounterId: slot?.id,
          pokemonId:   selectedPokemon?.id,
          nickname:    data.nickname || undefined,
          shiny:       data.shiny,
          notes:       data.notes || undefined,
        });
        if (isTrade && tradeAwayPokemon) {
          await runsApi.updatePokemonStatus(runId, tradeAwayPokemon.id, { status: 'FAINTED' });
        }
        await qc.invalidateQueries({ queryKey: ['runs', runId, 'routes'] });
        await qc.invalidateQueries({ queryKey: ['runs', runId] });
        await qc.invalidateQueries({ queryKey: ['runs', runId, 'team'] });
        await qc.invalidateQueries({ queryKey: ['runs', runId, 'box'] });
        await qc.invalidateQueries({ queryKey: ['all-caught', runId] });
      }
      onClose();
    } catch (err: unknown) {
      let msg = t('encounter.error');
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: { detail?: string; title?: string } } }).response;
        msg = res?.data?.detail ?? res?.data?.title ?? msg;
      }
      setSubmitError(msg);
      setPendingData(null);
    }
  }

  async function onSubmit(data: FormData) {
    if (needsPokemon && !selectedPokemon) {
      setSubmitError(t('encounter.selectPokemon'));
      return;
    }
    if (needsPokemon && nicknameRequired && !data.nickname?.trim()) {
      setSubmitError(t('encounter.nicknameRequired'));
      return;
    }
    if (isTrade && tradeCandidates.length > 0 && !tradeAwayPokemon && !isEditing) {
      setSubmitError(t('encounter.selectTradedAway'));
      return;
    }
    setSubmitError('');
    // For trades, skip team-full check — giving away a Pokémon frees a slot
    if (data.outcome === 'CAPTURED' && teamFull && !isEditing && !isTrade) {
      setPendingData(data);
      return;
    }
    await doSubmit(data, null);
  }

  return (
    <>
      <div className="modal-overlay" onClick={showSwapModal ? undefined : onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{route.routeName}</h2>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="modal-body">
            {isEditing && (
              <div style={{
                background: 'var(--accent-bg)', border: '1px solid var(--accent)',
                borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13,
              }}>
                {t('encounter.editing')}
                {firstEncounterOnly && (
                  <span style={{ color: 'var(--warning)', display: 'block', marginTop: 4 }}>
                    {t('encounter.classicWarning')}
                  </span>
                )}
              </div>
            )}

            {isForced ? (
              <p className="form-label" style={{ marginBottom: 8, color: isTrade ? 'var(--accent)' : 'var(--success)' }}>
                {route.encounterType === 'STARTER'
                  ? t('encounter.chooseStarter')
                  : isTrade
                    ? t('encounter.tradeReceive')
                    : t('encounter.guaranteed')}
              </p>
            ) : (
              <div className="form-group">
                <label className="form-label">{t('encounter.outcomeLabel')}</label>
                <div className="outcome-grid">
                  {OUTCOMES.map(o => (
                    <label key={o.value} style={{ display: 'contents' }}>
                      <input type="radio" value={o.value} {...register('outcome')} hidden />
                      <span
                        className={`outcome-btn${outcome === o.value ? ' selected' : ''}`}
                        style={outcome === o.value ? { borderColor: o.color, color: o.color } : undefined}
                        onClick={() => setValue('outcome', o.value)}
                      >
                        {t(`encounter.outcome.${o.value}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {needsPokemon && (
              <>
                <div className="form-group">
                  <label className="form-label">
                    {route.encounterType === 'STARTER'
                      ? t('encounter.starterLabel')
                      : isTrade
                        ? t('encounter.tradeReceivedLabel')
                        : t('encounter.capturedLabel')}
                  </label>
                  <PokemonSearch onSelect={setSelectedPokemon} initialPokemon={existingPokemon} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('encounter.nickname')}</label>
                  <input
                    className="form-input"
                    {...register('nickname')}
                    placeholder={t('encounter.nicknamePlaceholder')}
                  />
                </div>
                <div className="form-check">
                  <input type="checkbox" id="shiny" {...register('shiny')} />
                  <label htmlFor="shiny">{t('encounter.isShiny')}</label>
                </div>
              </>
            )}

            {isTrade && !isEditing && tradeCandidates.length > 0 && (
              <div className="form-group">
                <label className="form-label">{t('encounter.tradedAwayLabel')}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {tradeCandidates.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`btn btn-ghost btn-full${tradeAwayPokemon?.id === p.id ? ' btn-primary' : ''}`}
                      style={{ textAlign: 'left', justifyContent: 'flex-start', gap: 8 }}
                      onClick={() => setTradeAwayPokemon(prev => prev?.id === p.id ? null : p)}
                    >
                      {p.currentPokemonSpriteUrl && (
                        <img
                          src={p.shiny ? toShinySpriteUrl(p.currentPokemonSpriteUrl) : p.currentPokemonSpriteUrl}
                          alt=""
                          style={{ width: 24, height: 24, imageRendering: 'pixelated', flexShrink: 0 }}
                        />
                      )}
                      <span>{p.nickname ?? p.currentPokemonName}</span>
                      {p.status === 'BOXED' && (
                        <span style={{ opacity: 0.6, fontSize: 12, marginLeft: 'auto' }}>📦</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t('encounter.notes')}</label>
              <textarea
                className="form-input"
                rows={2}
                {...register('notes')}
                placeholder={t('encounter.notesPlaceholder')}
              />
            </div>

            {speciesConflict && (
              <div style={{
                background: 'rgba(245,158,11,.12)', border: '1px solid #f59e0b',
                borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#f59e0b',
              }}>
                {t('encounter.speciesConflict')}
              </div>
            )}

            {submitError && <p className="form-error">{submitError}</p>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !outcome}
            >
              {isSubmitting ? t('btn.saving') : isForced ? t('btn.confirm') : t('encounter.record')}
            </button>

            {onDelete && slot?.caughtPokemon && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ marginTop: 6, fontSize: 12, color: 'var(--danger)', opacity: 0.8 }}
                disabled={isDeleting}
                onClick={async () => {
                  const name = slot.caughtPokemon!.nickname ?? slot.caughtPokemon!.currentPokemonName;
                  if (!window.confirm(t('team.action.deleteConfirm', { name }))) return;
                  setIsDeleting(true);
                  try { await onDelete(); } finally { setIsDeleting(false); }
                }}
              >
                {isDeleting ? t('btn.saving') : t('team.action.delete')}
              </button>
            )}
          </form>
        </div>
      </div>

      {showSwapModal && (
        <div className="modal-overlay" style={{ zIndex: 210 }} onClick={() => setPendingData(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('encounter.teamFull')}</h2>
              <button type="button" className="modal-close" onClick={() => setPendingData(null)} aria-label="Cerrar">✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                {t('encounter.teamFullQuestion')}
              </p>
              <button
                className="btn btn-ghost btn-full"
                style={{ textAlign: 'left', marginBottom: 8 }}
                onClick={() => doSubmit(pendingData!, 'box')}
              >
                {t('encounter.sendToBox')}
              </button>
              {teamMembers.length > 0 && (
                <>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '12px 0 8px' }}>
                    {t('encounter.orChooseSwap')}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {teamMembers.map(p => (
                      <button
                        key={p.id}
                        className={`btn btn-ghost btn-full ${memberToBox?.id === p.id ? 'btn-primary' : ''}`}
                        style={{ textAlign: 'left' }}
                        onClick={() => setMemberToBox(prev => prev?.id === p.id ? null : p)}
                      >
                        {p.nickname ?? p.currentPokemonName}
                      </button>
                    ))}
                  </div>
                  {memberToBox && (
                    <button
                      className="btn btn-primary btn-full"
                      style={{ marginTop: 12 }}
                      onClick={() => doSubmit(pendingData!, memberToBox)}
                    >
                      {t('encounter.confirmSwap', { name: memberToBox.nickname ?? memberToBox.currentPokemonName })}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
