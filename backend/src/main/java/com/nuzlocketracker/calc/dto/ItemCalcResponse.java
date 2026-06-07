package com.nuzlocketracker.calc.dto;

import java.util.Map;

public record ItemCalcResponse(long itemId, String name, Map<String, Object> effect) {}
