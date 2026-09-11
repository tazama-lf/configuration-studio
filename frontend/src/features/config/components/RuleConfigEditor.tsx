import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  TextField,
  IconButton,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Paper,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { sanitizeId } from '../../../utils/validation';
import { MAX_ID_LENGTH, MAX_REASON_LENGTH, MAX_SHORT_VALUE_LENGTH } from '../../../utils/constants';

// ── Known parameter keys (from Tazama rule configurations) ────────────────

const KNOWN_PARAMETER_KEYS = [
  'maxQueryRange',
  'maxQueryRangeUpstream',
  'maxQueryRangeDownstream',
  'maxQueryLimit',
  'tolerance',
  'commission',
  'evaluationIntervalTime',
  'minimumNumberOfTransactions',
  'maxRadius',
] as const;

// ── Types ──────────────────────────────────────────────────────────────────

interface ExitCondition {
  subRuleRef: string;
  reason: string;
}

interface Band {
  subRuleRef: string;
  reason: string;
  lowerLimit?: number;
  upperLimit?: number;
}

interface CaseExpression {
  value: string;
  reason: string;
  subRuleRef: string;
}

interface CaseAlternative {
  reason: string;
  subRuleRef: string;
}

interface ParameterRow {
  key: string;
  value: string;
}

interface Timeframe {
  start: string;
  end: string;
  days?: string[];
}

type ConfigType = 'bands' | 'cases';

interface RuleConfigEditorProps {
  value: string; // JSON string
  onChange: (json: string) => void;
  readOnly?: boolean;
  id?: string;
  cfg?: string;
  desc?: string;
  tenantId?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function detectConfigType(config: Record<string, unknown>): ConfigType {
  if (Array.isArray(config.bands) && config.bands.length > 0) return 'bands';
  if (config.cases && typeof config.cases === 'object') return 'cases';
  return 'bands';
}

function parseConfig(json: string): {
  configType: ConfigType;
  parameters: ParameterRow[];
  exitConditions: ExitCondition[];
  bands: Band[];
  caseExpressions: CaseExpression[];
  caseAlternative: CaseAlternative;
  timeframes: Timeframe[];
} {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(json) as Record<string, unknown>;
  } catch {
    /* empty config */
  }

  const configType = detectConfigType(parsed);

  // Parameters
  const rawParams = (parsed.parameters ?? {}) as Record<string, unknown>;
  const parameters: ParameterRow[] = Object.entries(rawParams).map(([key, value]) => ({
    key,
    value: String(value),
  }));

  // Exit conditions
  const exitConditions: ExitCondition[] = Array.isArray(parsed.exitConditions)
    ? (parsed.exitConditions as ExitCondition[])
    : [];

  // Bands
  const bands: Band[] = Array.isArray(parsed.bands)
    ? (parsed.bands as Band[])
    : [];

  // Cases
  const rawCases = parsed.cases as
    | { alternative?: CaseAlternative; expressions?: CaseExpression[] }
    | undefined;
  const caseExpressions: CaseExpression[] = Array.isArray(rawCases?.expressions)
    ? rawCases!.expressions!
    : [];
  const caseAlternative: CaseAlternative = rawCases?.alternative ?? {
    reason: '',
    subRuleRef: '',
  };

  // Timeframes (new in frms-coe-lib 8.2.0)
  const timeframes: Timeframe[] = Array.isArray(parsed.timeframes)
    ? (parsed.timeframes as Timeframe[])
    : [];

  return { configType, parameters, exitConditions, bands, caseExpressions, caseAlternative, timeframes };
}

// ── Component ──────────────────────────────────────────────────────────────

const RuleConfigEditor: React.FC<RuleConfigEditorProps> = ({ value, onChange, readOnly = false, id = '', cfg = '', desc = '', tenantId = '' }) => {
  const initial = useMemo(() => parseConfig(value), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [configType, setConfigType] = useState<ConfigType>(initial.configType);
  const [parameters, setParameters] = useState<ParameterRow[]>(initial.parameters);
  const [exitConditions, setExitConditions] = useState<ExitCondition[]>(initial.exitConditions);
  const [bands, setBands] = useState<Band[]>(initial.bands);
  const [caseExpressions, setCaseExpressions] = useState<CaseExpression[]>(initial.caseExpressions);
  const [caseAlternative, setCaseAlternative] = useState<CaseAlternative>(initial.caseAlternative);
  const [timeframes, setTimeframes] = useState<Timeframe[]>(initial.timeframes);

  // ── Generate JSON ──────────────────────────────────────────────────────

  const generatedConfig = useMemo(() => {
    const config: Record<string, unknown> = {};

    // Parameters (always present, even if empty)
    const paramObj: Record<string, unknown> = {};
    for (const p of parameters) {
      if (p.key.trim()) {
        const numVal = Number(p.value);
        paramObj[p.key] = !Number.isNaN(numVal) && p.value.trim() !== '' ? numVal : p.value;
      }
    }
    config.parameters = paramObj;

    // Exit conditions (always present, even if empty)
    config.exitConditions = exitConditions.filter(
      (ec) => ec.subRuleRef.trim() || ec.reason.trim(),
    );

    // Timeframes (new in frms-coe-lib 8.2.0 — only include if non-empty)
    const validTimeframes = timeframes.filter(
      (tf) => tf.start.trim() || tf.end.trim(),
    );
    if (validTimeframes.length > 0) {
      config.timeframes = validTimeframes;
    }

    if (configType === 'bands') {
      // Bands (always present, even if empty)
      config.bands = bands.filter(
        (b) => b.subRuleRef.trim() || b.reason.trim() || b.lowerLimit !== undefined || b.upperLimit !== undefined,
      );
    } else {
      // Cases (always present, even if empty)
      const casesObj: Record<string, unknown> = {};
      const hasAlternative = caseAlternative.subRuleRef.trim() || caseAlternative.reason.trim();
      if (hasAlternative) casesObj.alternative = caseAlternative;
      casesObj.expressions = caseExpressions.filter(
        (ce) => ce.value.trim() || ce.subRuleRef.trim() || ce.reason.trim(),
      );
      config.cases = casesObj;
    }

    return config;
  }, [configType, parameters, exitConditions, bands, caseExpressions, caseAlternative, timeframes]);

  // Full payload preview including id, cfg, desc, config, tenantId (always present)
  // creDtTm and updDtTm are auto-injected by the backend on create/update
  const fullPreviewJson = useMemo(() => {
    const payload: Record<string, unknown> = {};
    if (id) payload.id = id;
    if (cfg) payload.cfg = cfg;
    payload.desc = desc;
    payload.config = generatedConfig;
    if (tenantId) payload.tenantId = tenantId;
    return JSON.stringify(payload, null, 2);
  }, [id, cfg, desc, tenantId, generatedConfig]);

  // Sync back to parent — send the full preview JSON so what's previewed is what's saved
  useEffect(() => {
    onChange(fullPreviewJson);
  }, [fullPreviewJson]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers: Parameters ───────────────────────────────────────────────

  const addParameter = (): void => {
    setParameters([...parameters, { key: '', value: '' }]);
  };
  const updateParameter = (idx: number, field: keyof ParameterRow, val: string): void => {
    const next = [...parameters];
    next[idx] = { ...next[idx], [field]: val };
    setParameters(next);
  };
  const removeParameter = (idx: number): void => {
    setParameters(parameters.filter((_, i) => i !== idx));
  };

  // ── Handlers: Exit Conditions ──────────────────────────────────────────

  const addExitCondition = (): void => {
    setExitConditions([...exitConditions, { subRuleRef: '', reason: '' }]);
  };
  const updateExitCondition = (idx: number, field: keyof ExitCondition, val: string): void => {
    const next = [...exitConditions];
    next[idx] = { ...next[idx], [field]: val };
    setExitConditions(next);
  };
  const removeExitCondition = (idx: number): void => {
    setExitConditions(exitConditions.filter((_, i) => i !== idx));
  };

  // ── Handlers: Timeframes ───────────────────────────────────────────────

  const addTimeframe = (): void => {
    setTimeframes([...timeframes, { start: '', end: '' }]);
  };
  const updateTimeframe = (idx: number, field: keyof Timeframe, val: string | string[]): void => {
    const next = [...timeframes];
    next[idx] = { ...next[idx], [field]: val };
    setTimeframes(next);
  };
  const removeTimeframe = (idx: number): void => {
    setTimeframes(timeframes.filter((_, i) => i !== idx));
  };

  // ── Handlers: Bands ────────────────────────────────────────────────────

  const addBand = (): void => {
    setBands([...bands, { subRuleRef: '', reason: '' }]);
  };
  const updateBand = (idx: number, field: keyof Band, val: string | number | undefined): void => {
    const next = [...bands];
    next[idx] = { ...next[idx], [field]: val };
    setBands(next);
  };
  const removeBand = (idx: number): void => {
    setBands(bands.filter((_, i) => i !== idx));
  };

  // ── Handlers: Case Expressions ─────────────────────────────────────────

  const addCaseExpression = (): void => {
    setCaseExpressions([...caseExpressions, { value: '', reason: '', subRuleRef: '' }]);
  };
  const updateCaseExpression = (idx: number, field: keyof CaseExpression, val: string): void => {
    const next = [...caseExpressions];
    next[idx] = { ...next[idx], [field]: val };
    setCaseExpressions(next);
  };
  const removeCaseExpression = (idx: number): void => {
    setCaseExpressions(caseExpressions.filter((_, i) => i !== idx));
  };

  // ── Render ─────────────────────────────────────────────────────────────

  const sectionSx = { mb: 3 } as const;
  const rowSx = { display: 'flex', gap: 1, alignItems: 'flex-start', mb: 2.5 } as const;

  return (
    <Box>
      {/* Config Type Toggle */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Config Type
        </Typography>
        <ToggleButtonGroup
          value={configType}
          exclusive
          onChange={(_, v: ConfigType | null) => v && setConfigType(v)}
          disabled={readOnly}
          size="small"
        >
          <ToggleButton value="bands">Bands</ToggleButton>
          <ToggleButton value="cases">Cases</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Parameters */}
      <Box sx={sectionSx}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Parameters
        </Typography>
        {parameters.map((p, idx) => (
          <Box key={idx} sx={rowSx}>
            <TextField
              size="small"
              select
              label="Key"
              value={p.key}
              onChange={(e) => updateParameter(idx, 'key', e.target.value)}
              disabled={readOnly}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            >
              <MenuItem value="" disabled>
                Select key
              </MenuItem>
              {KNOWN_PARAMETER_KEYS.map((key) => (
                <MenuItem key={key} value={key}>
                  {key}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              type="number"
              label="Value"
              placeholder="123"
              value={p.value}
              onChange={(e) => updateParameter(idx, 'value', e.target.value)}
              disabled={readOnly}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            {!readOnly && (
              <IconButton size="small" color="error" onClick={() => removeParameter(idx)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}
        {!readOnly && (
          <Button size="small" startIcon={<AddIcon />} onClick={addParameter}>
            Add Parameter
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Exit Conditions */}
      <Box sx={sectionSx}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Exit Conditions
        </Typography>
        {exitConditions.map((ec, idx) => (
          <Box key={idx} sx={rowSx}>
            <TextField
              size="small"
              label="Sub Rule Ref"
              placeholder=".x00"
              value={ec.subRuleRef}
              onChange={(e) => updateExitCondition(idx, 'subRuleRef', sanitizeId(e.target.value))}
              disabled={readOnly}
              slotProps={{ htmlInput: { maxLength: MAX_ID_LENGTH } }}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="Reason"
              placeholder="Incoming transaction is unsuccessful"
              value={ec.reason}
              onChange={(e) => updateExitCondition(idx, 'reason', e.target.value)}
              disabled={readOnly}
              slotProps={{ htmlInput: { maxLength: MAX_REASON_LENGTH } }}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 2 }}
            />
            {!readOnly && (
              <IconButton size="small" color="error" onClick={() => removeExitCondition(idx)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}
        {!readOnly && (
          <Button size="small" startIcon={<AddIcon />} onClick={addExitCondition}>
            Add Exit Condition
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Timeframes (new in frms-coe-lib 8.2.0) */}
      <Box sx={sectionSx}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Timeframes
        </Typography>
        {timeframes.map((tf, idx) => (
          <Box key={idx} sx={{ ...rowSx, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              label="Start"
              placeholder="00:00"
              value={tf.start}
              onChange={(e) => updateTimeframe(idx, 'start', e.target.value)}
              disabled={readOnly}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1, minWidth: 100 }}
            />
            <TextField
              size="small"
              label="End"
              placeholder="23:59"
              value={tf.end}
              onChange={(e) => updateTimeframe(idx, 'end', e.target.value)}
              disabled={readOnly}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1, minWidth: 100 }}
            />
            <TextField
              size="small"
              label="Days (comma-separated)"
              placeholder="MON,TUE,WED"
              value={(tf.days ?? []).join(',')}
              onChange={(e) => updateTimeframe(idx, 'days', e.target.value.split(',').map((d) => d.trim()).filter(Boolean))}
              disabled={readOnly}
              slotProps={{ htmlInput: { maxLength: MAX_SHORT_VALUE_LENGTH } }}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 2, minWidth: 200 }}
            />
            {!readOnly && (
              <IconButton size="small" color="error" onClick={() => removeTimeframe(idx)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}
        {!readOnly && (
          <Button size="small" startIcon={<AddIcon />} onClick={addTimeframe}>
            Add Timeframe
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Bands or Cases */}
      {configType === 'bands' ? (
        <Box sx={sectionSx}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Bands
          </Typography>
          {bands.map((b, idx) => (
            <Box key={idx} sx={{ ...rowSx, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label="Sub Rule Ref"
                placeholder=".01"
                value={b.subRuleRef}
                onChange={(e) => updateBand(idx, 'subRuleRef', sanitizeId(e.target.value))}
                disabled={readOnly}
                slotProps={{ htmlInput: { maxLength: MAX_ID_LENGTH } }}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, minWidth: 120 }}
              />
              <TextField
                size="small"
                label="Reason"
                placeholder="The debtor is younger than 18 years old"
                value={b.reason}
                onChange={(e) => updateBand(idx, 'reason', e.target.value)}
                disabled={readOnly}
                slotProps={{ htmlInput: { maxLength: MAX_REASON_LENGTH } }}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 2, minWidth: 200 }}
              />
              <TextField
                size="small"
                type="number"
                label="Lower Limit"
                placeholder="0"
                value={b.lowerLimit ?? ''}
                onChange={(e) =>
                  updateBand(idx, 'lowerLimit', e.target.value === '' ? undefined : Number(e.target.value))
                }
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, minWidth: 100 }}
              />
              <TextField
                size="small"
                type="number"
                label="Upper Limit"
                placeholder="18"
                value={b.upperLimit ?? ''}
                onChange={(e) =>
                  updateBand(idx, 'upperLimit', e.target.value === '' ? undefined : Number(e.target.value))
                }
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, minWidth: 100 }}
              />
              {!readOnly && (
                <IconButton size="small" color="error" onClick={() => removeBand(idx)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
          {!readOnly && (
            <Button size="small" startIcon={<AddIcon />} onClick={addBand}>
              Add Band
            </Button>
          )}
        </Box>
      ) : (
        <Box sx={sectionSx}>
          {/* Expressions */}
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Expressions
          </Typography>
          {caseExpressions.map((ce, idx) => (
            <Box key={idx} sx={{ ...rowSx, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label="Sub Rule Ref"
                placeholder=".01"
                value={ce.subRuleRef}
                onChange={(e) => updateCaseExpression(idx, 'subRuleRef', sanitizeId(e.target.value))}
                disabled={readOnly}
                slotProps={{ htmlInput: { maxLength: MAX_ID_LENGTH } }}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, minWidth: 120 }}
              />
              <TextField
                size="small"
                label="Value"
                placeholder="CASH"
                value={ce.value}
                onChange={(e) => updateCaseExpression(idx, 'value', e.target.value)}
                disabled={readOnly}
                slotProps={{ htmlInput: { maxLength: MAX_SHORT_VALUE_LENGTH } }}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, minWidth: 100 }}
              />
              <TextField
                size="small"
                label="Reason"
                placeholder="The transaction is identified as a general cash management instruction"
                value={ce.reason}
                onChange={(e) => updateCaseExpression(idx, 'reason', e.target.value)}
                disabled={readOnly}
                slotProps={{ htmlInput: { maxLength: MAX_REASON_LENGTH } }}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 2, minWidth: 200 }}
              />
              {!readOnly && (
                <IconButton size="small" color="error" onClick={() => removeCaseExpression(idx)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
          {!readOnly && (
            <Button size="small" startIcon={<AddIcon />} onClick={addCaseExpression}>
              Add Expression
            </Button>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Alternative (fallback case) */}
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Alternative (Fallback)
          </Typography>
          <Box sx={rowSx}>
            <TextField
              size="small"
              label="Sub Rule Ref"
              placeholder=".00"
              value={caseAlternative.subRuleRef}
              onChange={(e) => setCaseAlternative({ ...caseAlternative, subRuleRef: sanitizeId(e.target.value) })}
              disabled={readOnly}
              slotProps={{ htmlInput: { maxLength: MAX_ID_LENGTH } }}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="Reason"
              placeholder="The transaction type is not defined in this rule configuration"
              value={caseAlternative.reason}
              onChange={(e) => setCaseAlternative({ ...caseAlternative, reason: e.target.value })}
              disabled={readOnly}
              slotProps={{ htmlInput: { maxLength: MAX_REASON_LENGTH } }}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 2 }}
            />
          </Box>
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* JSON Preview */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          JSON Preview (read-only)
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            backgroundColor: '#f5f5f5',
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          <Typography
            component="pre"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              whiteSpace: 'pre-wrap',
              margin: 0,
              color: '#374151',
            }}
          >
            {fullPreviewJson}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default RuleConfigEditor;
