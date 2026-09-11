import React, { useState, useEffect, useCallback } from "react";
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
  Switch,
  FormControlLabel,
  Tooltip,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ViewIcon from "@mui/icons-material/Visibility";
import ActivateIcon from "@mui/icons-material/CheckCircle";
import DeactivateIcon from "@mui/icons-material/Stop";
import ReloadIcon from "@mui/icons-material/Refresh";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import CustomTable from "../../../common/Tables/CustomTable";
import Loader from "../../../shared/components/ui/Loader";
import { useToast } from "../../../shared/providers/ToastProvider";
import { useAuth } from "../../auth/contexts/AuthContext";
import { configApi, type PaginatedResponse } from "../services/configApi";
import NetworkMapConfigEditor from "../components/NetworkMapConfigEditor";

interface NetworkMapRecord {
  cfg: string;
  active: boolean;
  messages: string;
  tenantId: string;
  creDtTm?: string;
  updDtTm?: string;
  __rowId?: string;
}

const PAGE_LIMIT = 20;

const NetworkMapPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? "default";
  const [records, setRecords] = useState<NetworkMapRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  // Dialog state
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<NetworkMapRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<NetworkMapRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Reload dialog state
  const [reloadDialogOpen, setReloadDialogOpen] = useState(false);

  // Row action menu state
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null);
  const [actionMenuRecord, setActionMenuRecord] = useState<NetworkMapRecord | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    cfg: "1.0.0",
    active: true,
    messages: "[]",
    tenantId: "default",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await configApi.list<NetworkMapRecord>("network_map", {
        limit: PAGE_LIMIT,
        offset: page * PAGE_LIMIT,
      });
      setRecords(
        result.data.map(
          (r, idx) =>
            ({ ...r, __rowId: `${r.cfg}-${idx}` }) as NetworkMapRecord & { __rowId: string },
        ),
      );
      setTotalRecords(result.meta.total);
    } catch (err) {
      showError("Failed to load network maps", err instanceof Error ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [page, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateClick = () => {
    setDialogMode("create");
    setFormData({ cfg: "1.0.0", active: true, messages: "[]", tenantId });
    setDialogOpen(true);
  };

  const handleEditClick = (record: NetworkMapRecord) => {
    setDialogMode("edit");
    setSelectedRecord(record);
    setFormData({
      cfg: record.cfg,
      active: record.active,
      messages:
        typeof record.messages === "string"
          ? record.messages
          : JSON.stringify(record.messages ?? [], null, 2),
      tenantId: record.tenantId ?? tenantId,
    });
    setDialogOpen(true);
  };

  const handleViewClick = (record: NetworkMapRecord) => {
    setDialogMode("view");
    setSelectedRecord(record);
    setFormData({
      cfg: record.cfg,
      active: record.active,
      messages:
        typeof record.messages === "string"
          ? record.messages
          : JSON.stringify(record.messages ?? [], null, 2),
      tenantId: record.tenantId ?? tenantId,
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (record: NetworkMapRecord) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleActivate = async (record: NetworkMapRecord) => {
    const activeMap = records.find((r) => r.active);
    if (activeMap && activeMap.cfg !== record.cfg) {
      showError(
        "Failed to activate network map",
        `Network map ${activeMap.cfg} is already active. Deactivate it first.`,
      );
      return;
    }
    setActionLoading(true);
    setActionMenuAnchor(null);
    try {
      await configApi.activateNetworkMap(record.cfg, "broadcast");
      showSuccess(`Network map ${record.cfg} activated successfully`);
      fetchData();
    } catch (err) {
      showError("Failed to activate network map", err instanceof Error ? err.message : undefined);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (record: NetworkMapRecord) => {
    setActionLoading(true);
    setActionMenuAnchor(null);
    try {
      await configApi.deactivateNetworkMap(record.cfg);
      showSuccess(`Network map ${record.cfg} deactivated successfully`);
      fetchData();
    } catch (err) {
      showError("Failed to deactivate network map", err instanceof Error ? err.message : undefined);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReload = async (mode: "broadcast" | "cascade") => {
    setActionLoading(true);
    setReloadDialogOpen(false);
    try {
      await configApi.reloadNetworkMap(mode);
      showSuccess(`Network map reloaded (${mode} mode)`);
      fetchData();
    } catch (err) {
      showError("Failed to reload network map", err instanceof Error ? err.message : undefined);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.cfg.trim()) {
      showError("Validation error", "Config Version is required");
      return;
    }
    let parsedMessages: unknown = [];
    try {
      parsedMessages = JSON.parse(formData.messages || "[]");
    } catch {
      showError("Validation error", "Messages must be valid JSON");
      return;
    }
    // Ensure messages is a JSON array — a common user mistake is pasting
    // a single object (for example a user record) instead of an array.
    if (!Array.isArray(parsedMessages)) {
      showError(
        "Validation error",
        "Messages must be a JSON array (e.g. [] or [{ id: 'x', cfg: '1.0.0', ... }])",
      );
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        cfg: formData.cfg,
        active: formData.active,
        messages: parsedMessages,
        tenantId,
      };
      if (dialogMode === "create") {
        await configApi.create("network_map", payload);
        showSuccess("Network map created successfully");
      } else if (dialogMode === "edit" && selectedRecord) {
        await configApi.update("network_map", "", selectedRecord.cfg, payload);
        showSuccess("Network map updated successfully");
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      showError("Failed to save network map", err instanceof Error ? err.message : undefined);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    setActionLoading(true);
    try {
      await configApi.delete("network_map", "", recordToDelete.cfg);
      showSuccess("Network map deleted successfully");
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      fetchData();
    } catch (err) {
      showError("Failed to delete network map", err instanceof Error ? err.message : undefined);
    } finally {
      setActionLoading(false);
    }
  };

  const isReadOnly = dialogMode === "view";

  const columns: GridColDef[] = [
    { field: "cfg", headerName: "Config Version", width: 130 },
    {
      field: "active",
      headerName: "Active",
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <span style={{ color: params.value ? "#10b981" : "#ef4444", fontWeight: 600 }}>
          {params.value ? "Yes" : "No"}
        </span>
      ),
    },
    {
      field: "messages",
      headerName: "Messages",
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => {
        const val = params.value;
        if (Array.isArray(val)) return `${val.length} message(s)`;
        return typeof val === "string" ? val : "";
      },
    },
    {
      field: "creDtTm",
      headerName: "Created At",
      width: 180,
      type: "string",
      valueFormatter: (value: unknown) => {
        if (!value) return "";
        const d = new Date(value as string);
        return isNaN(d.getTime()) ? String(value) : d.toLocaleString();
      },
    },
    {
      field: "updDtTm",
      headerName: "Updated At",
      width: 180,
      type: "string",
      valueFormatter: (value: unknown) => {
        if (!value) return "";
        const d = new Date(value as string);
        return isNaN(d.getTime()) ? String(value) : d.toLocaleString();
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const record = params.row as NetworkMapRecord;
        return (
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
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
            {record.active ? (
              <Tooltip title="Deactivate">
                <IconButton size="small" color="warning" onClick={() => handleDeactivate(record)}>
                  <DeactivateIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Activate">
                <IconButton size="small" color="success" onClick={() => handleActivate(record)}>
                  <ActivateIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "#374151" }}>
          Network Map Configuration
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ReloadIcon />}
            onClick={() => setReloadDialogOpen(true)}
            sx={{ borderColor: "#6b7280", color: "#374151" }}
          >
            Reload
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
            sx={{ backgroundColor: "#3b82f6", "&:hover": { backgroundColor: "#2563eb" } }}
          >
            Create New
          </Button>
        </Box>
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
              sortModel: [{ field: "updDtTm", sort: "desc" }],
            },
          }}
        />
      )}

      {/* Create / Edit / View Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {dialogMode === "create"
            ? "Create Network Map"
            : dialogMode === "edit"
              ? "Edit Network Map"
              : "View Network Map"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Config Version"
              value={formData.cfg}
              onChange={(e) => setFormData({ ...formData, cfg: e.target.value })}
              disabled={isReadOnly || dialogMode === "edit"}
              required
              fullWidth
              helperText={dialogMode === "edit" ? "Config version cannot be changed" : undefined}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  disabled={isReadOnly}
                />
              }
              label="Active"
            />
            <Divider />
            <NetworkMapConfigEditor
              key={`${dialogMode}-${selectedRecord?.cfg ?? "new"}`}
              value={formData.messages}
              onChange={(json) => setFormData({ ...formData, messages: json })}
              readOnly={isReadOnly}
              cfg={formData.cfg}
              active={formData.active}
              tenantId={tenantId}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{isReadOnly ? "Close" : "Cancel"}</Button>
          {!isReadOnly && (
            <Button variant="contained" onClick={handleSave} disabled={actionLoading}>
              {dialogMode === "create" ? "Create" : "Save"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the network map with config version{" "}
            <strong>{recordToDelete?.cfg}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={actionLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reload Mode Dialog */}
      <Dialog
        open={reloadDialogOpen}
        onClose={() => setReloadDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reload Network Map</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Choose a reload mode to re-dispatch the active network map:
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ReloadIcon />}
              onClick={() => handleReload("broadcast")}
              sx={{ justifyContent: "flex-start" }}
            >
              Broadcast — Notify all service channels
            </Button>
            <Button
              variant="outlined"
              startIcon={<ReloadIcon />}
              onClick={() => handleReload("cascade")}
              sx={{ justifyContent: "flex-start" }}
            >
              Cascade — Propagate to dependent services
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReloadDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NetworkMapPage;
