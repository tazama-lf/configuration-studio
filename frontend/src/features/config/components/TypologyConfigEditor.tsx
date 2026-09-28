import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  IconButton,
  Typography,
  Divider,
  Paper,
  Autocomplete,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { configApi } from '../services/configApi';
import { sanitizeId, getNextSubRuleRef } from '../../../utils/validation';
import { MAX_ID_LENGTH } from '../../../utils/constants';

// ── Types ──────────────────────────────────────────────────────────────────

interface Weight {
  ref: string;
  wght: number;
}

interface TypologyRule {
  id: string;
  cfg: string;
  wghts: Weight[];
  termId: string;
}

interface Workflow {
  alertThreshold: number;
  interdictionThreshold?: number;
  flowProcessor: string;
}

interface TypologyConfigEditorProps {
  value: string; // JSON string of the full config
  onChange: (json: string) => void;
  readOnly?: boolean;
  id?: string;
  cfg?: string;
  desc?: string;
  tenantId?: string;
  hideJsonPreview?: boolean;
  onPreviewChange?: (json: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function TypologyConfigEditor({
  value,
  onChange,
  readOnly = false,
  id,
  cfg,
  desc,
  tenantId,
  hideJsonPreview = false,
  onPreviewChange,
}: TypologyConfigEditorProps) {
  // Rule options fetched from the rules table — stored as { id, cfg, desc }
  const [ruleOptions, setRuleOptions] = useState<
    Array<{ id: string; cfg: string; desc?: string }>
  >([]);

  // Local state parsed from value
  const [rules, setRules] = useState<TypologyRule[]>([]);
  const [expression, setExpression] = useState<string[]>([]);
  const [workflow, setWorkflow] = useState<Workflow>({
    alertThreshold: 0,
    interdictionThreshold: 0,
    flowProcessor: '',
  });
  // ── Fetch rule IDs for dropdown ──────────────────────────────────────────
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const result = await configApi.list<{
          id: string;
          cfg: string;
          desc?: string;
        }>('rule', {
          limit: 100,
          offset: 0,
        });
        setRuleOptions(
          result.data.map((r) => ({ id: r.id, cfg: r.cfg, desc: r.desc })),
        );
      } catch {
        // silently fail — dropdown will just be empty
      }
    };
    fetchRules();
  }, []);

  // ── Parse incoming value (only when it differs from what we generated) ───
  const lastEmittedRef = useRef<string>('');
  useEffect(() => {
    // Skip parsing if this value came from our own emit
    if (value === lastEmittedRef.current) return;
    try {
      const parsed = JSON.parse(value || '{}');
      setRules(Array.isArray(parsed.rules) ? parsed.rules : []);
      setExpression(Array.isArray(parsed.expression) ? parsed.expression : []);
      setWorkflow(
        parsed.workflow ?? {
          alertThreshold: 0,
          interdictionThreshold: 0,
          flowProcessor: '',
        },
      );
    } catch {
      // keep defaults
    }
  }, [value]);

  // ── Build the full config object and emit ────────────────────────────────
  const generatedConfig = useMemo(() => {
    const config: Record<string, unknown> = {
      rules,
      expression,
      workflow,
    };
    return config;
  }, [rules, expression, workflow]);

  // Full preview including top-level fields in the required order
  const fullPreviewJson = useMemo(() => {
    const preview: Record<string, unknown> = {};
    if (desc) preview.desc = desc;
    if (id) preview.id = id;
    if (cfg) preview.cfg = cfg;
    if (tenantId) preview.tenantId = tenantId;
    preview.workflow = {
      alertThreshold: workflow.alertThreshold,
      interdictionThreshold: workflow.interdictionThreshold,
      flowProcessor: workflow.flowProcessor,
    };
    preview.rules = rules;
    preview.expression = expression;
    return JSON.stringify(preview, null, 2);
  }, [rules, expression, workflow, id, cfg, desc, tenantId]);

  // Emit changes — but only if the generated JSON differs from the incoming value
  // to avoid infinite update loops
  useEffect(() => {
    const json = JSON.stringify(generatedConfig, null, 2);
    if (json !== value) {
      lastEmittedRef.current = json;
      onChange(json);
    }
  }, [generatedConfig, onChange, value]);

  useEffect(() => {
    onPreviewChange?.(fullPreviewJson);
  }, [fullPreviewJson, onPreviewChange]);

  // ── Rule helpers ─────────────────────────────────────────────────────────
  const addRule = () => {
    setRules([
      ...rules,
      { id: '', cfg: '1.0.0', wghts: [{ ref: '.err', wght: 0 }], termId: '' },
    ]);
  };

  const updateRule = (idx: number, patch: Partial<TypologyRule>) => {
    setRules(rules.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  // ── Weight helpers ───────────────────────────────────────────────────────
  const addWeight = (ruleIdx: number) => {
    const rule = rules[ruleIdx];
    const ref = getNextSubRuleRef(
      rule.wghts.map((w) => w.ref),
      { start: 1 },
    );
    updateRule(ruleIdx, { wghts: [...rule.wghts, { ref, wght: 0 }] });
  };

  const updateWeight = (
    ruleIdx: number,
    wIdx: number,
    patch: Partial<Weight>,
  ) => {
    const rule = rules[ruleIdx];
    const newWghts = rule.wghts.map((w, i) =>
      i === wIdx ? { ...w, ...patch } : w,
    );
    updateRule(ruleIdx, { wghts: newWghts });
  };

  const removeWeight = (ruleIdx: number, wIdx: number) => {
    const rule = rules[ruleIdx];
    updateRule(ruleIdx, { wghts: rule.wghts.filter((_, i) => i !== wIdx) });
  };

  // ── Expression helpers ───────────────────────────────────────────────────
  const expressionOps = ['Add'];

  const updateExpressionItem = (idx: number, val: string) => {
    setExpression(expression.map((e, i) => (i === idx ? val : e)));
  };

  const addExpressionItem = () => {
    setExpression([...expression, '']);
  };

  const removeExpressionItem = (idx: number) => {
    setExpression(expression.filter((_, i) => i !== idx));
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Form */}
      <Box>
        {/* Rules Section */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Rules
            </Typography>
            {!readOnly && (
              <Button size="small" startIcon={<AddIcon />} onClick={addRule}>
                Add Rule
              </Button>
            )}
          </Box>

          {rules.map((rule, rIdx) => {
            const ruleDesc = ruleOptions.find(
              (r) => r.id === rule.id && r.cfg === rule.cfg,
            )?.desc;
            return (
              <Accordion key={rIdx} defaultExpanded sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      width: '100%',
                      pr: 2,
                    }}
                  >
                    <Chip
                      label={`Rule ${rIdx + 1}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                      <Typography
                        variant="body2"
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {rule.id || '(not selected)'}
                      </Typography>
                      {ruleDesc && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {ruleDesc}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
                  >
                    {!readOnly && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => { removeRule(rIdx); }}
                        >
                          Remove Rule
                        </Button>
                      </Box>
                    )}
                    {/* Rule selection — dropdown shows id@cfg with description */}
                    <Autocomplete
                      options={ruleOptions}
                      getOptionLabel={(option) =>
                        typeof option === 'string' ? option : option.id
                      }
                      isOptionEqualToValue={(option, value) =>
                        typeof option === 'string' || typeof value === 'string'
                          ? option === value
                          : option.id === value.id
                      }
                      value={
                        rule.id
                          ? (ruleOptions.find(
                              (r) => r.id === rule.id && r.cfg === rule.cfg,
                            ) ?? { id: rule.id, cfg: rule.cfg })
                          : null
                      }
                      onChange={(
                        _,
                        val:
                          | string
                          | { id: string; cfg: string; desc?: string }
                          | null,
                      ) => {
                        if (!val || typeof val === 'string') {
                          const v = typeof val === 'string' ? val : '';
                          if (!v) {
                            updateRule(rIdx, { id: '', cfg: '' });
                          } else {
                            const atIndex = v.lastIndexOf('@');
                            if (atIndex > -1) {
                              updateRule(rIdx, {
                                id: v.substring(0, atIndex),
                                cfg: v.substring(atIndex + 1),
                              });
                            } else {
                              updateRule(rIdx, { id: v, cfg: '1.0.0' });
                            }
                          }
                        } else {
                          updateRule(rIdx, { id: val.id, cfg: val.cfg });
                        }
                      }}
                      disabled={readOnly}
                      renderOption={(props, option) => {
                        const opt =
                          typeof option === 'string'
                            ? { id: option, cfg: '', desc: '' }
                            : option;
                        return (
                          <Box component="li" {...props}>
                            <Box
                              sx={{ display: 'flex', flexDirection: 'column' }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500 }}
                              >
                                {opt.id}
                              </Typography>
                              {opt.desc && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {opt.desc}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      }}
                      renderInput={(params) => {
                        const selectedDesc = rule.id
                          ? ruleOptions.find(
                              (r) => r.id === rule.id && r.cfg === rule.cfg,
                            )?.desc
                          : undefined;
                        return (
                          <TextField
                            {...params}
                            label="Rule Id"
                            size="small"
                            fullWidth
                            required
                            helperText={
                              selectedDesc ??
                              'Select an existing rule from the dropdown'
                            }
                          />
                        );
                      }}
                    />

                    {/* Term Id */}
                    <TextField
                      label="Term Id"
                      value={rule.termId}
                      onChange={(e) =>
                        { updateRule(rIdx, { termId: e.target.value }); }
                      }
                      disabled={readOnly}
                      size="small"
                      fullWidth
                      required
                      placeholder="v001at100at100"
                      slotProps={{ htmlInput: { maxLength: MAX_ID_LENGTH } }}
                    />

                    {/* Weights */}
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, color: '#6b7280' }}
                        >
                          Weights
                        </Typography>
                        {!readOnly && (
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => { addWeight(rIdx); }}
                          >
                            Add Weight
                          </Button>
                        )}
                      </Box>
                      {rule.wghts.map((w, wIdx) => (
                        <Box
                          key={wIdx}
                          sx={{
                            display: 'flex',
                            gap: 1,
                            mb: 1.5,
                            alignItems: 'center',
                          }}
                        >
                          <TextField
                            label="Ref"
                            value={w.ref}
                            disabled
                            size="small"
                            sx={{ flex: 1 }}
                            helperText="Auto-generated"
                          />
                          <TextField
                            label="Weight"
                            type="number"
                            value={w.wght}
                            onChange={(e) =>
                              { updateWeight(rIdx, wIdx, {
                                wght: Number(e.target.value),
                              }); }
                            }
                            disabled={readOnly}
                            size="small"
                            sx={{ flex: 1 }}
                          />
                          {!readOnly && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => { removeWeight(rIdx, wIdx); }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}

          {rules.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', py: 1 }}
            >
              No rules added yet
            </Typography>
          )}
        </Paper>

        {/* Expression Section */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Expression
            </Typography>
            {!readOnly && (
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={addExpressionItem}
              >
                Add Item
              </Button>
            )}
          </Box>
          {expression.map((expr, eIdx) => (
            <Box
              key={eIdx}
              sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center' }}
            >
              {eIdx === 0 ? (
                <TextField
                  select
                  label="Operation"
                  value={expr}
                  onChange={(e) => { updateExpressionItem(eIdx, e.target.value); }}
                  disabled={readOnly}
                  size="small"
                  sx={{ flex: 1 }}
                >
                  {expressionOps.map((op) => (
                    <MenuItem key={op} value={op}>
                      {op}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  select
                  label={`Term ${eIdx}`}
                  value={expr}
                  onChange={(e) => { updateExpressionItem(eIdx, e.target.value); }}
                  disabled={readOnly}
                  size="small"
                  sx={{ flex: 1 }}
                  helperText="Select a termId from a rule above"
                >
                  {rules
                    .filter((r) => r.termId)
                    .map((r) => (
                      <MenuItem key={r.termId} value={r.termId}>
                        {r.termId}
                      </MenuItem>
                    ))}
                </TextField>
              )}
              {!readOnly && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => { removeExpressionItem(eIdx); }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
          {expression.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', py: 1 }}
            >
              No expression items
            </Typography>
          )}
        </Paper>

        {/* Workflow Section */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Workflow
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Alert Threshold"
                type="number"
                value={workflow.alertThreshold}
                onChange={(e) =>
                  { setWorkflow({
                    ...workflow,
                    alertThreshold: Number(e.target.value),
                  }); }
                }
                disabled={readOnly}
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Interdiction Threshold"
                type="number"
                value={workflow.interdictionThreshold ?? 0}
                onChange={(e) =>
                  { setWorkflow({
                    ...workflow,
                    interdictionThreshold: Number(e.target.value),
                  }); }
                }
                disabled={readOnly}
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>
            <TextField
              label="Flow Processor"
              value={workflow.flowProcessor}
              onChange={(e) =>
                { setWorkflow({ ...workflow, flowProcessor: sanitizeId(e.target.value) }); }
              }
              disabled={readOnly}
              size="small"
              fullWidth
              placeholder="EFRuP@1.0.0"
              helperText="Rule that acts as the flow processor"
              slotProps={{ htmlInput: { maxLength: MAX_ID_LENGTH } }}
            />
          </Box>
        </Paper>
      </Box>

      {!hideJsonPreview && (
        <Box>
          <Paper
            variant="outlined"
            sx={{ p: 2, maxHeight: '40vh', overflow: 'auto' }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              JSON Preview
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Box
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                lineHeight: 1.5,
                color: '#374151',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                m: 0,
              }}
            >
              {fullPreviewJson}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
