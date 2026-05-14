import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Box,
  Button,
  Stack,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from "@mui/material";
import { ExpandMore, Search, Refresh } from "@mui/icons-material";
import { CippFormComponent } from "../../../components/CippComponents/CippFormComponent";
import { Grid } from "@mui/system";
import { Layout as DashboardLayout } from "../../../layouts/index.js";
import { CippTablePage } from "../../../components/CippComponents/CippTablePage";
import { ApiGetCall } from "../../../api/ApiCall";

const levelOptions = [
  { label: "All Levels", value: "" },
  { label: "Debug", value: "DBG" },
  { label: "Information", value: "INF" },
  { label: "Warning", value: "WRN" },
  { label: "Error", value: "ERR" },
  { label: "Critical", value: "CRT" },
];

const timeRangeOptions = [
  { label: "Last 15 minutes", value: "15" },
  { label: "Last 30 minutes", value: "30" },
  { label: "Last 1 hour", value: "60" },
  { label: "Last 3 hours", value: "180" },
  { label: "Last 6 hours", value: "360" },
  { label: "Last 12 hours", value: "720" },
  { label: "Last 24 hours", value: "1440" },
  { label: "Custom Range", value: "custom" },
  { label: "No Time Filter", value: "" },
];

const getLevelColor = (level) => {
  switch (level) {
    case "CRT":
      return "error";
    case "ERR":
      return "error";
    case "WRN":
      return "warning";
    case "INF":
      return "info";
    case "DBG":
      return "default";
    default:
      return "default";
  }
};

const getLevelLabel = (level) => {
  switch (level) {
    case "CRT":
      return "Critical";
    case "ERR":
      return "Error";
    case "WRN":
      return "Warning";
    case "INF":
      return "Info";
    case "DBG":
      return "Debug";
    case "TRC":
      return "Trace";
    default:
      return level || "Unknown";
  }
};

const ContainerLogsFilter = ({ onSubmitFilter }) => {
  const [expanded, setExpanded] = useState(true);

  const formControl = useForm({
    mode: "onChange",
    defaultValues: {
      timeRange: "60",
      level: "",
      search: "",
      file: "",
      tail: "500",
      searchAll: false,
      fromDate: "",
      toDate: "",
    },
  });

  const { handleSubmit } = formControl;
  const timeRange = useWatch({ control: formControl.control, name: "timeRange" });

  const fileListQuery = ApiGetCall({
    url: "/api/ListContainerLogs",
    data: { Action: "ListFiles" },
    queryKey: "ContainerLogFiles",
  });

  const fileOptions = useMemo(() => {
    const opts = [{ label: "Current Log", value: "" }];
    if (fileListQuery.isSuccess && fileListQuery.data?.Results) {
      fileListQuery.data.Results.forEach((f) => {
        if (!f.IsCurrent) {
          opts.push({
            label: `${f.Name} (${f.SizeFormatted})`,
            value: f.Name,
          });
        }
      });
    }
    return opts;
  }, [fileListQuery.isSuccess, fileListQuery.data]);

  const onSubmit = (values) => {
    const params = {
      Action: values.searchAll ? "SearchAll" : "ReadLog",
      Tail: values.tail || "500",
    };

    // Level filter
    const levelVal = Array.isArray(values.level) ? values.level[0]?.value : values.level;
    if (levelVal) params.Level = levelVal;

    // Search text
    if (values.search) params.Search = values.search;

    // File selection
    const fileVal = Array.isArray(values.file) ? values.file[0]?.value : values.file;
    if (fileVal && !values.searchAll) params.File = fileVal;

    // Time range
    const rangeVal = Array.isArray(values.timeRange)
      ? values.timeRange[0]?.value
      : values.timeRange;
    if (rangeVal === "custom") {
      if (values.fromDate) params.From = new Date(values.fromDate).toISOString();
      if (values.toDate) params.To = new Date(values.toDate).toISOString();
    } else if (rangeVal && rangeVal !== "") {
      const minutes = parseInt(rangeVal, 10);
      if (!isNaN(minutes)) {
        params.From = new Date(Date.now() - minutes * 60 * 1000).toISOString();
      }
    }

    onSubmitFilter(params);
    setExpanded(false);
  };

  const handleClear = () => {
    formControl.reset();
    onSubmitFilter(null);
    setExpanded(true);
  };

  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="h6">Log Filters</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={3}>
          <Alert severity="info">
            Search the local container log files directly. Logs are rotated by size and retained on
            disk. Use &ldquo;Search All Files&rdquo; to search across rotated log files.
          </Alert>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <CippFormComponent
                    type="autoComplete"
                    name="timeRange"
                    label="Time Range"
                    formControl={formControl}
                    options={timeRangeOptions}
                    multiple={false}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <CippFormComponent
                    type="autoComplete"
                    name="level"
                    label="Log Level"
                    formControl={formControl}
                    options={levelOptions}
                    multiple={false}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <CippFormComponent
                    type="textField"
                    name="search"
                    label="Search Text"
                    formControl={formControl}
                    placeholder="Filter by text content"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <CippFormComponent
                    type="textField"
                    name="tail"
                    label="Max Lines"
                    formControl={formControl}
                    placeholder="500"
                  />
                </Grid>
              </Grid>

              {(Array.isArray(timeRange) ? timeRange[0]?.value : timeRange) === "custom" && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <CippFormComponent
                      type="textField"
                      name="fromDate"
                      label="From (UTC)"
                      formControl={formControl}
                      placeholder="YYYY-MM-DD HH:mm"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <CippFormComponent
                      type="textField"
                      name="toDate"
                      label="To (UTC)"
                      formControl={formControl}
                      placeholder="YYYY-MM-DD HH:mm"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              )}

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <CippFormComponent
                    type="autoComplete"
                    name="file"
                    label="Log File"
                    formControl={formControl}
                    options={fileOptions}
                    multiple={false}
                    isFetching={fileListQuery.isFetching}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <CippFormComponent
                    type="switch"
                    name="searchAll"
                    label="Search All Files (including rotated)"
                    formControl={formControl}
                  />
                </Grid>
              </Grid>

              <Stack direction="row" spacing={2}>
                <Button type="submit" variant="contained" startIcon={<Search />}>
                  Search Logs
                </Button>
                <Button variant="outlined" onClick={handleClear}>
                  Clear
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

const Page = () => {
  const [apiFilter, setApiFilter] = useState(null);
  const queryKey = JSON.stringify(apiFilter);

  return (
    <CippTablePage
      tableFilter={
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <ContainerLogsFilter onSubmitFilter={setApiFilter} />
          </Grid>
        </Grid>
      }
      clearOnError={true}
      offCanvas={{
        size: "lg",
        children: (row) => {
          const levelColor = getLevelColor(row.Level);
          return (
            <Box sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Box>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Chip
                      label={getLevelLabel(row.Level)}
                      color={levelColor}
                      size="medium"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {row.Timestamp}
                    </Typography>
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Message
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "background.default",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="body1"
                      component="pre"
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "0.875rem",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        m: 0,
                      }}
                    >
                      {row.Message}
                    </Typography>
                  </Box>
                </Box>
                {row.Raw && row.Raw !== row.Message && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Raw Log Line
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "background.default",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography
                        variant="body1"
                        component="pre"
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "0.75rem",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          m: 0,
                        }}
                      >
                        {row.Raw}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Box>
          );
        },
      }}
      title="Container Logs"
      tenantInTitle={false}
      apiDataKey="Results"
      apiUrl={apiFilter ? "/api/ListContainerLogs" : "/api/ListEmptyResults"}
      apiData={apiFilter}
      queryKey={queryKey}
      simpleColumns={["Timestamp", "Level", "Message"]}
      actions={[]}
    />
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
