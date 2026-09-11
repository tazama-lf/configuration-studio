import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  Tooltip,
  InputAdornment,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewIcon from '@mui/icons-material/Visibility';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import CustomTable from '../../../common/Tables/CustomTable';
import Loader from '../../../shared/components/ui/Loader';
import { useToast } from '../../../shared/providers/ToastProvider';
import { useAuth } from '../../auth/contexts/AuthContext';
import { configApi } from '../services/configApi';
import TypologyConfigEditor from '../components/TypologyConfigEditor';
import { sanitizeId, isValidConfigVersion } from '../../../utils/validation';
import { MAX_ID_LENGTH, MAX_CONFIG_VERSION_LENGTH, MAX_DESCRIPTION_LENGTH } from '../../../utils/constants';

interface TypologyRecord {
  id: string;
  cfg: string;
  desc?: string;
  rules?: Array<{ id: string; cfg: string; wghts: unknown[]; termId: string }>;
  expression?: unknown[];
  workflow?: {
    alertThreshold: number;
    interdictionThreshold?: number;
    flowProcessor?: string;
  };
  tenantId?: string;
  creDtTm?: string;
  updDtTm?: string;
  __rowId?: string;
}

const PAGE_LIMIT = 20;

const TypologyPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? 'default';
  const tenantPrefix = `${tenantId}-typology-`;
  const [records, setRecords] = useState<TypologyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  // Dialog state
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TypologyRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<TypologyRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form fields — config is a JSON string managed by TypologyConfigEditor
  const [formData, setFormData] = useState({
    id: '',
    cfg: '',
    desc: '',
    config: '{}',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await configApi.list<TypologyRecord>('typology', {
        limit: PAGE_LIMIT,
        offset: page * PAGE_LIMIT,
      });
      setRecords(result.data.map((r, idx) => ({ ...r, __rowId: `${r.id}-${r.cfg}` || `row-${idx}` })));
      setTotalRecords(result.meta.total);
    } catch (err) {
      showError('Failed to load typologies', err instanceof Error ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [page, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateClick = () => {
    setDialogMode('create');
    setFormData({ id: '', cfg: '', desc: '', config: '{}' });
    setDialogOpen(true);
  };

  const handleEditClick = (record: TypologyRecord) => {
    setDialogMode('edit');
    setSelectedRecord(record);
    const configObj: Record<string, unknown> = {};
    if (record.rules) configObj.rules = record.rules;
    if (record.expression) configObj.expression = record.expression;
    if (record.workflow) configObj.workflow = record.workflow;
    setFormData({
      id: record.id,
      cfg: record.cfg,
      desc: record.desc ?? '',
      config: JSON.stringify(configObj, null, 2),
    });
    setDialogOpen(true);
  };

  const handleViewClick = (record: TypologyRecord) => {
    setDialogMode('view');
    setSelectedRecord(record);
    const configObj: Record<string, unknown> = {};
    if (record.rules) configObj.rules = record.rules;
    if (record.expression) configObj.expression = record.expression;
    if (record.workflow) configObj.workflow = record.workflow;
    setFormData({
      id: record.id,
      cfg: record.cfg,
      desc: record.desc ?? '',
      config: JSON.stringify(configObj, null, 2),
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (record: TypologyRecord) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.id.trim()) {
      showError('Validation error', 'ID is required');
      return;
    }
    if (!formData.cfg.trim()) {
      showError('Validation error', 'Config Version is required');
      return;
    }
    if (!isValidConfigVersion(formData.cfg)) {
      showError('Validation error', 'Config Version must contain only digits and dots (e.g. 1.0.0)');
      return;
    }
    if (!formData.desc.trim()) {
      showError('Validation error', 'Description is required');
      return;
    }
    let parsedConfig: Record<string, unknown> = {};
    try {
      parsedConfig = JSON.parse(formData.config || '{}');
    } catch {
      showError('Validation error', 'Config must be valid JSON');
      return;
    }
    const fullId = dialogMode === 'create' ? `${tenantPrefix}${formData.id}` : formData.id;
    setActionLoading(true);
    try {
      const payload = {
        id: fullId,
        cfg: formData.cfg,
        desc: formData.desc,
        rules: parsedConfig.rules ?? [],
        expression: parsedConfig.expression ?? [],
        workflow: parsedConfig.workflow ?? {},
        tenantId,
      };
      if (dialogMode === 'create') {
        await configApi.create('typology', payload);
        showSuccess('Typology created successfully');
      } else if (dialogMode === 'edit' && selectedRecord) {
        await configApi.update('typology', selectedRecord.id, selectedRecord.cfg, payload);
        showSuccess('Typology updated successfully');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      showError('Failed to save typology', err instanceof Error ? err.message : undefined);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    setActionLoading(true);
    try {
      await configApi.delete('typology', recordToDelete.id, recordToDelete.cfg);
      showSuccess('Typology deleted successfully');
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      fetchData();
    } catch (err) {
      showError('Failed to delete typology', err instanceof Error ? err.message : undefined);
    } finally {
      setActionLoading(false);
    }
  };

  const isReadOnly = dialogMode === 'view';
  const cfgInvalid = formData.cfg.length > 0 && !isValidConfigVersion(formData.cfg);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', flex: 1, minWidth: 180 },
    { field: 'cfg', headerName: 'Config Version', width: 140 },
    { field: 'desc', headerName: 'Description', flex: 1, minWidth: 150 },
    {
      field: 'rules',
      headerName: 'Rules',
      width: 100,
      renderCell: (params: GridRenderCellParams) => {
        const rules = params.value;
        return Array.isArray(rules) ? `${rules.length} rule(s)` : '';
      },
    },
    {
      field: 'workflow',
      headerName: 'Alert Threshold',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const wf = params.value;
        return wf?.alertThreshold != null ? String(wf.alertThreshold) : '';
      },
    },
    { field: 'creDtTm', headerName: 'Created At', width: 180, type: 'string', valueFormatter: (value: unknown) => { if (!value) return ''; const d = new Date(value as string); return isNaN(d.getTime()) ? String(value) : d.toLocaleString(); } },
    { field: 'updDtTm', headerName: 'Updated At', width: 180, type: 'string', valueFormatter: (value: unknown) => { if (!value) return ''; const d = new Date(value as string); return isNaN(d.getTime()) ? String(value) : d.toLocaleString(); } },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const record = params.row as TypologyRecord;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View">
              <IconButton size="small" onClick={() => handleViewClick(record)}>
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => handleEditClick(record)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => handleDeleteClick(record)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#374151' }}>
          Typology Configuration
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
          sx={{ backgroundColor: '#f59e0b', '&:hover': { backgroundColor: '#d97706' } }}
        >
          Create New
        </Button>
      </Box>

      {loading || actionLoading ? (
        <Loader />
      ) : (
        <CustomTable
          columns={columns}
          rows={records}
          uniqueId="__rowId"
          pagination={{
            page,
            limit: PAGE_LIMIT,
            totalRecords,
            setPage,
          }}
          initialState={{
            sorting: {
              sortModel: [{ field: 'updDtTm', sort: 'desc' }],
            },
          }}
        />
      )}

      {/* Create / Edit / View Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create Typology' : dialogMode === 'edit' ? 'Edit Typology' : 'View Typology'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Define a typology that associates a set of rules with weights, an expression to combine
              their results, and workflow thresholds for alerting and interdiction.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="ID"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: sanitizeId(e.target.value) })}
                disabled={isReadOnly || dialogMode === 'edit'}
                required
                fullWidth
                placeholder="901"
                slotProps={{ htmlInput: { maxLength: MAX_ID_LENGTH } }}
                helperText={dialogMode === 'edit' ? 'ID cannot be changed' : undefined}
                InputProps={
                  dialogMode === 'create'
                    ? {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography variant="body2" color="text.secondary">
                              {tenantPrefix}
                            </Typography>
                          </InputAdornment>
                        ),
                      }
                    : undefined
                }
              />
              <TextField
                label="Config Version"
                value={formData.cfg}
                onChange={(e) => setFormData({ ...formData, cfg: e.target.value.replace(/[^0-9.]/g, '') })}
                disabled={isReadOnly || dialogMode === 'edit'}
                required
                fullWidth
                placeholder="1.0.0"
                error={cfgInvalid}
                slotProps={{ htmlInput: { maxLength: MAX_CONFIG_VERSION_LENGTH } }}
                helperText={
                  dialogMode === 'edit'
                    ? 'Config version cannot be changed'
                    : cfgInvalid
                      ? 'Config Version must contain only digits and dots (e.g. 1.0.0)'
                      : undefined
                }
              />
            </Box>
            <TextField
              label="Description"
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              disabled={isReadOnly}
              required
              fullWidth
              placeholder="Typology for set of rules"
              slotProps={{ htmlInput: { maxLength: MAX_DESCRIPTION_LENGTH } }}
            />
            <Divider />
            <TypologyConfigEditor
              key={`${dialogMode}-${selectedRecord?.id ?? 'new'}-${selectedRecord?.cfg ?? ''}`}
              value={formData.config}
              onChange={(json) => setFormData({ ...formData, config: json })}
              readOnly={isReadOnly}
              id={dialogMode === 'create' ? `${tenantPrefix}${formData.id}` : formData.id}
              cfg={formData.cfg}
              desc={formData.desc}
              tenantId={tenantId}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isReadOnly && (
            <Button variant="contained" onClick={handleSave} disabled={actionLoading || cfgInvalid}>
              {dialogMode === 'create' ? 'Create' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the typology{' '}
            <strong>{recordToDelete?.id}</strong> (cfg: {recordToDelete?.cfg})?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={actionLoading}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TypologyPage;
