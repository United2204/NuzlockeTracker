package com.nuzlocketracker.calc;

import com.nuzlocketracker.calc.dto.ItemCalcResponse;
import com.nuzlocketracker.calc.dto.PokemonCalcDataResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CalcController {

    private final CalcService calcService;

    @GetMapping("/pokemon/{id}/calc-data")
    public PokemonCalcDataResponse getCalcData(
            @PathVariable Long id,
            @RequestParam(required = false) Long gameId,
            @RequestParam(defaultValue = "en") String lang
    ) {
        return calcService.getCalcData(id, gameId, lang);
    }

    @GetMapping("/items/calc")
    public List<ItemCalcResponse> getCalcItems(
            @RequestParam(defaultValue = "en") String lang
    ) {
        return calcService.getCalcItems(lang);
    }
}
