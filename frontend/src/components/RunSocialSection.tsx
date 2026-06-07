import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi, type Comment, type ReactionSummary } from '../api/social';
import { useAuth } from '../hooks/useAuth';

// ── Reactions ─────────────────────────────────────────────────────────────────

function ReactionsBar({ runId }: { runId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['runs', runId, 'reactions'],
    queryFn:  () => socialApi.getReactions(runId).then(r => r.data),
  });

  const toggleMut = useMutation({
    mutationFn: (reactionTypeId: number) => socialApi.toggleReaction(runId, reactionTypeId),
    onSuccess: (res) => qc.setQueryData<ReactionSummary>(['runs', runId, 'reactions'], res.data),
  });

  if (isLoading || !data) return null;

  const { counts, available } = data;
  const countsMap = new Map(counts.map(c => [c.reactionTypeId, c]));

  return (
    <div className="reactions-bar">
      {available.map(rt => {
        const entry = countsMap.get(rt.id);
        const userReacted = entry?.userReacted ?? false;
        const count = entry?.count ?? 0;
        return (
          <button
            key={rt.id}
            className={`reaction-btn ${userReacted ? 'reaction-btn--active' : ''}`}
            onClick={() => toggleMut.mutate(rt.id)}
            disabled={toggleMut.isPending}
            title={rt.label}
          >
            <span>{rt.emoji || rt.label}</span>
            {count > 0 && <span className="reaction-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Comments ──────────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  runId,
  onReply,
}: {
  comment: Comment;
  runId: string;
  onReply: (parentId: number) => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const deleteMut = useMutation({
    mutationFn: () => socialApi.deleteComment(runId, comment.id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['runs', runId, 'comments'] }),
  });

  const isOwn = user?.id === comment.authorId;

  return (
    <div className="comment-item">
      <div className="comment-header">
        <span className="comment-author">@{comment.authorUsername}</span>
        <span className="comment-date">
          {new Date(comment.createdAt).toLocaleDateString('es', {
            day: 'numeric', month: 'short'
          })}
        </span>
      </div>
      <p className="comment-content">{comment.content}</p>
      <div className="comment-actions">
        {!comment.parentId && (
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '2px 6px' }}
            onClick={() => onReply(comment.id)}>
            Responder
          </button>
        )}
        {isOwn && (
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '2px 6px', color: 'var(--danger)' }}
            onClick={() => deleteMut.mutate()}>
            Eliminar
          </button>
        )}
      </div>
      {comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(r => (
            <CommentItem key={r.id} comment={r} runId={runId} onReply={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentForm({
  runId,
  parentId,
  onCancel,
}: {
  runId: string;
  parentId?: number;
  onCancel?: () => void;
}) {
  const [text, setText] = useState('');
  const qc = useQueryClient();

  const postMut = useMutation({
    mutationFn: () => socialApi.postComment(runId, text, parentId),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['runs', runId, 'comments'] });
      onCancel?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    postMut.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <textarea
        className="form-input"
        placeholder={parentId ? 'Responder...' : 'Escribí un comentario...'}
        value={text}
        onChange={e => setText(e.target.value)}
        style={{ minHeight: 70, fontSize: 14, resize: 'vertical' }}
        maxLength={2000}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}
          disabled={postMut.isPending || !text.trim()}>
          {postMut.isPending ? 'Enviando...' : parentId ? 'Responder' : 'Comentar'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export function RunSocialSection({ runId }: { runId: string }) {
  const [replyTo, setReplyTo] = useState<number | null>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['runs', runId, 'comments'],
    queryFn:  () => socialApi.getComments(runId).then(r => r.data),
  });

  return (
    <div className="run-social-section">
      <ReactionsBar runId={runId} />

      <div className="social-divider" />

      <h3 className="social-section-title">Comentarios</h3>

      <CommentForm runId={runId} />

      {isLoading && <div className="spinner" style={{ margin: '24px auto' }} />}

      {!isLoading && comments.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', marginTop: 16 }}>
          Sin comentarios aún. ¡Sé el primero!
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        {comments.map(c => (
          <div key={c.id}>
            <CommentItem
              comment={c}
              runId={runId}
              onReply={id => setReplyTo(id === replyTo ? null : id)}
            />
            {replyTo === c.id && (
              <div style={{ marginLeft: 24 }}>
                <CommentForm
                  runId={runId}
                  parentId={c.id}
                  onCancel={() => setReplyTo(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
