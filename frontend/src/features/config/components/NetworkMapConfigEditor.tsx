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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { configApi } from '../services/configApi';
import { sanitizeId } from '../../../utils/validation';

// ── Types ──────────────────────────────────────────────────────────────────

interface RuleRef {
  id: string;
  cfg: string;
}

interface TypologyRef {
  id: string;
  cfg: string;
  rules: RuleRef[];
  tenantId: string;
}

interface Message {
  id: string;
  cfg: string;
  txTp: string;
  typologies: TypologyRef[];
}

interface NetworkMapConfigEditorProps {
  value: string; // JSON string of messages array
  onChange: (json: string) => void;
  readOnly?: boolean;
  cfg?: string;
  active?: boolean;
  tenantId?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function NetworkMapConfigEditor({
  value,
  onChange,
  readOnly = false,
  cfg,
  active,
  tenantId,
}: NetworkMapConfigEditorProps) {
  // Full typology records (to auto-load rules when selected)
  const [typologyRecords, setTypologyRecords] = useState<
    Array<{ id: string; cfg: string; desc?: string; rules?: Array<{ id: string; cfg: string }> }>
  >([]);
  // Rule records for description lookup
  const [ruleRecords, setRuleRecords] = useState<
    Array<{ id: string; cfg: string; desc?: string }>
  >([]);

  // Local state
  const [messages, setMessages] = useState<Message[]>([]);

  // ── Fetch typologies for dropdown ────────────────────────────────────────
  useEffect(() => {
    const fetchTypologies = async () => {
      try {
        const result = await configApi.list<{
          id: string;
          cfg: string;
          desc?: string;
          rules?: Array<{ id: string; cfg: string }>;
        }>('typology', {
          limit: 100,
          offset: 0,
        });
        setTypologyRecords(result.data);
        // Fetch rule records for description lookup
        const ruleResult = await configApi.list<{ id: string; cfg: string; desc?: string }>('rule', {
          limit: 100,
          offset: 0,
        });
        setRuleRecords(ruleResult.data);
      } catch {
        // silently fail
      }
    };
    fetchTypologies();
  }, []);

  // ── Parse incoming value ─────────────────────────────────────────────────
  const lastEmittedRef = useRef<string>('');
  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    try {
      const parsed = JSON.parse(value || '[]');
      setMessages(Array.isArray(parsed) ? parsed : []);
    } catch {
      // keep defaults
    }
  }, [value]);

  // ── Build JSON and emit ──────────────────────────────────────────────────
  const generatedJson = useMemo(() => JSON.stringify(messages, null, 2), [messages]);

  const fullPreviewJson = useMemo(() => {
    const preview: Record<string, unknown> = {};
    if (cfg) preview.cfg = cfg;
    if (active !== undefined) preview.active = active;
    preview.messages = messages;
    if (tenantId) preview.tenantId = tenantId;
    return JSON.stringify(preview, null, 2);
  }, [messages, cfg, active, tenantId]);

  useEffect(() => {
    if (generatedJson !== value) {
      lastEmittedRef.current = generatedJson;
      onChange(generatedJson);
    }
  }, [generatedJson, onChange, value]);

  // ── Message helpers ──────────────────────────────────────────────────────
  const addMessage = () => {
    setMessages([
      ...messages,
      { id: '', cfg: '1.0.0', txTp: '', typologies: [] },
    ]);
  };

  const updateMessage = (idx: number, patch: Partial<Message>) => {
    setMessages(messages.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };

  const removeMessage = (idx: number) => {
    setMessages(messages.filter((_, i) => i !== idx));
  };

  // ── Typology helpers ─────────────────────────────────────────────────────
  const addTypology = (msgIdx: number) => {
    const msg = messages[msgIdx];
    updateMessage(msgIdx, {
      typologies: [...msg.typologies, { id: '', cfg: '', rules: [], tenantId: tenantId ?? 'default' }],
    });
  };

  const updateTypology = (msgIdx: number, tIdx: number, patch: Partial<TypologyRef>) => {
    const msg = messages[msgIdx];
    const newTypologies = msg.typologies.map((t, i) => (i === tIdx ? { ...t, ...patch } : t));
    updateMessage(msgIdx, { typologies: newTypologies });
  };

  const removeTypology = (msgIdx: number, tIdx: number) => {
    const msg = messages[msgIdx];
    updateMessage(msgIdx, { typologies: msg.typologies.filter((_, i) => i !== tIdx) });
  };

  // When a typology is selected from the dropdown, auto-load its rules
  const selectTypology = (msgIdx: number, tIdx: number, selectedValue: string | null) => {
    if (!selectedValue) {
      updateTypology(msgIdx, tIdx, { id: '', cfg: '', rules: [] });
      return;
    }
    // Match against the full composite "id@cfg" from typologyRecords
    const typologyRec = typologyRecords.find((t) => `${t.id}@${t.cfg}` === selectedValue);
    if (typologyRec) {
      const rules: RuleRef[] = typologyRec.rules
        ? typologyRec.rules.map((r) => ({ id: r.id, cfg: r.cfg }))
        : [];
      updateTypology(msgIdx, tIdx, { id: typologyRec.id, cfg: typologyRec.cfg, rules });
    } else {
      // Fallback: try lastIndexOf('@') split
      const atIndex = selectedValue.lastIndexOf('@');
      const tId = atIndex > -1 ? selectedValue.substring(0, atIndex) : selectedValue;
      const tCfg = atIndex > -1 ? selectedValue.substring(atIndex + 1) : '';
      updateTypology(msgIdx, tIdx, { id: tId, cfg: tCfg, rules: [] });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Messages Section */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Messages
          </Typography>
          {!readOnly && (
            <Button size="small" startIcon={<AddIcon />} onClick={addMessage}>
              Add Message
            </Button>
          )}
        </Box>

        {messages.map((msg, mIdx) => (
          <Accordion key={mIdx} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', pr: 2 }}>
                <Chip label={`Message ${mIdx + 1}`} size="small" color="primary" variant="outlined" />
                <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {msg.txTp || msg.id || '(empty)'}
                </Typography>
                <Chip label={`${msg.typologies.length} typology(s)`} size="small" variant="outlined" />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {!readOnly && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => removeMessage(mIdx)}>
                      Remove Message
                    </Button>
                  </Box>
                )}

                {/* Message ID, Config Version, Transaction Type */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <TextField
                    label="Message ID"
                    value={msg.id}
                    onChange={(e) => updateMessage(mIdx, { id: sanitizeId(e.target.value) })}
                    disabled={readOnly}
                    size="small"
                    sx={{ flex: 1, minWidth: 180 }}
                  />
                  <TextField
                    label="Config Version"
                    value={msg.cfg}
                    onChange={(e) => updateMessage(mIdx, { cfg: e.target.value })}
                    disabled={readOnly}
                    size="small"
                    sx={{ flex: 1, minWidth: 120 }}
                  />
                  <TextField
                    label="Transaction Type (txTp)"
                    value={msg.txTp}
                    onChange={(e) => updateMessage(mIdx, { txTp: e.target.value })}
                    disabled={readOnly}
                    size="small"
                    sx={{ flex: 2, minWidth: 200 }}
                  />
                </Box>

                <Divider sx={{ my: 0.5 }} />

                {/* Typologies for this message */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280' }}>
                      Typologies
                    </Typography>
                    {!readOnly && (
                      <Button size="small" startIcon={<AddIcon />} onClick={() => addTypology(mIdx)}>
                        Add Typology
                      </Button>
                    )}
                  </Box>

                  {msg.typologies.map((typo, tIdx) => (
                    <Paper key={tIdx} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <Autocomplete
                          options={typologyRecords}
                          getOptionLabel={(option) =>
                            typeof option === 'string' ? option : `${option.id}@${option.cfg}`
                          }
                          isOptionEqualToValue={(option, value) =>
                            typeof option === 'string' || typeof value === 'string'
                              ? option === value
                              : option.id === value.id && option.cfg === value.cfg
                          }
                          value={
                            typo.id
                              ? typologyRecords.find((t) => t.id === typo.id && t.cfg === typo.cfg) ?? { id: typo.id, cfg: typo.cfg }
                              : null
                          }
                          onChange={(_, val) => {
                            if (!val || typeof val === 'string') {
                              selectTypology(mIdx, tIdx, typeof val === 'string' ? val : null);
                            } else {
                              selectTypology(mIdx, tIdx, `${val.id}@${val.cfg}`);
                            }
                          }}
                          disabled={readOnly}
                          renderOption={(props, option) => {
                            const opt = typeof option === 'string' ? { id: option, cfg: '', desc: '' } : option;
                            return (
                              <Box component="li" {...props}>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {`${opt.id}@${opt.cfg}`}
                                  </Typography>
                                  {opt.desc && (
                                    <Typography variant="caption" color="text.secondary">
                                      {opt.desc}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            );
                          }}
                          renderInput={(params) => {
                            const selectedDesc = typo.id
                              ? typologyRecords.find((t) => t.id === typo.id && t.cfg === typo.cfg)?.desc
                              : undefined;
                            return (
                              <TextField
                                {...params}
                                label="Typology (id@cfg)"
                                size="small"
                                helperText={selectedDesc ?? 'Select a typology — rules auto-load'}
                              />
                            );
                          }}
                          sx={{ flex: 1 }}
                        />
                        {!readOnly && (
                          <IconButton size="small" color="error" onClick={() => removeTypology(mIdx, tIdx)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>

                      {/* Auto-loaded rules */}
                      {typo.rules.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', mb: 0.5, display: 'block' }}>
                            Rules (auto-loaded from typology)
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {typo.rules.map((rule, rIdx) => {
                              const ruleDesc = ruleRecords.find((r) => r.id === rule.id && r.cfg === rule.cfg)?.desc;
                              return (
                                <Box
                                  key={rIdx}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: 1,
                                    py: 0.5,
                                    px: 1,
                                    borderRadius: 1,
                                    bgcolor: '#f9fafb',
                                    border: '1px solid #f3f4f6',
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                    {`${rule.id}@${rule.cfg}`}
                                  </Typography>
                                  {ruleDesc && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                      {ruleDesc}
                                    </Typography>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  ))}

                  {msg.typologies.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 0.5 }}>
                      No typologies added
                    </Typography>
                  )}
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}

        {messages.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
            No messages added yet
          </Typography>
        )}
      </Paper>

      {/* JSON Preview */}
      <Box>
        <Paper variant="outlined" sx={{ p: 2, maxHeight: '40vh', overflow: 'auto' }}>
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
    </Box>
  );
}
