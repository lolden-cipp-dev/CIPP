import { useEffect } from "react";
import {
  Alert,
  Button,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { Grid } from "@mui/system";
import { useForm } from "react-hook-form";
import CippFormComponent from "../CippComponents/CippFormComponent";
import CippButtonCard from "../CippCards/CippButtonCard";
import { ApiGetCall, ApiPostCall } from "../../api/ApiCall";
import { CippApiResults } from "../CippComponents/CippApiResults";

const channelLabels = {
  latest: { label: "Latest (Stable)", color: "success" },
  dev: { label: "Dev", color: "warning" },
  nightly: { label: "Nightly", color: "info" },
  unknown: { label: "Unknown", color: "default" },
};

export const CippContainerManagement = () => {
  const formControl = useForm({
    mode: "onChange",
    defaultValues: { Channel: null },
  });

  const containerStatus = ApiGetCall({
    url: "/api/ExecContainerManagement",
    data: { Action: "Status" },
    queryKey: "containerStatus",
  });

  const containerAction = ApiPostCall({
    relatedQueryKeys: ["containerStatus"],
  });

  const data = containerStatus.data?.Results;
  const channelInfo = channelLabels[data?.CurrentChannel] ?? channelLabels.unknown;

  const channelOptions = (data?.ValidChannels ?? ["latest", "dev", "nightly"]).map((c) => ({
    label: channelLabels[c]?.label ?? c,
    value: c,
  }));

  useEffect(() => {
    if (containerStatus.isSuccess && data?.CurrentChannel) {
      const current = channelOptions.find((o) => o.value === data.CurrentChannel);
      if (current) {
        formControl.reset({ Channel: current });
      }
    }
  }, [containerStatus.isSuccess, data?.CurrentChannel]);

  const handleUpdateChannel = () => {
    const selected = formControl.getValues("Channel");
    const channel = selected?.value ?? selected;
    containerAction.mutate({
      url: "/api/ExecContainerManagement",
      data: { Action: "UpdateChannel", Channel: channel },
    });
  };

  const handleRestart = () => {
    containerAction.mutate({
      url: "/api/ExecContainerManagement",
      data: { Action: "Restart" },
    });
  };

  return (
    <Stack spacing={3}>
      <CippButtonCard title="Container Status" isFetching={containerStatus.isFetching}>
        <CardContent>
          {containerStatus.isLoading ? (
            <Stack spacing={2}>
              <Skeleton variant="rectangular" height={40} />
              <Skeleton variant="rectangular" height={40} />
            </Stack>
          ) : (
            <Stack spacing={2}>
              {data?.ConfiguredChannel && data.ConfiguredChannel !== data.CurrentChannel && (
                <Alert severity="warning">
                  A channel change is pending. Running: <strong>{data.CurrentChannel}</strong>,
                  configured: <strong>{data.ConfiguredChannel}</strong>. Restart the container to
                  apply.
                </Alert>
              )}
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Running Channel
                  </Typography>
                </Grid>
                <Grid size={{ xs: 8 }}>
                  <Chip label={channelInfo.label} color={channelInfo.color} size="small" />
                </Grid>

                <Grid size={{ xs: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Image Tag
                  </Typography>
                </Grid>
                <Grid size={{ xs: 8 }}>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {data?.ImageTag ?? "unknown"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    App Version
                  </Typography>
                </Grid>
                <Grid size={{ xs: 8 }}>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {data?.CurrentVersion ?? "unknown"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Commit SHA
                  </Typography>
                </Grid>
                <Grid size={{ xs: 8 }}>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {data?.CommitSha ?? "unknown"}
                  </Typography>
                </Grid>

                {data?.CurrentImage && data.CurrentImage !== "unknown" && (
                  <>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Container Image
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                        {data.CurrentImage}
                      </Typography>
                    </Grid>
                  </>
                )}

                {data?.SiteName && (
                  <>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        App Service
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <Typography variant="body2">{data.SiteName}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Stack>
          )}
        </CardContent>
      </CippButtonCard>

      <CippButtonCard title="Release Channel">
        <CardContent>
          <Stack spacing={2}>
            <Alert severity="warning">
              Changing the release channel updates the container image tag. The new image will be
              pulled on the next container restart. Switching to &quot;Dev&quot; or
              &quot;Nightly&quot; may include unstable or untested changes.
            </Alert>
            <CippFormComponent
              type="autoComplete"
              name="Channel"
              label="Release Channel"
              options={channelOptions}
              formControl={formControl}
              creatable={false}
              multiple={false}
            />
            <CippApiResults apiObject={containerAction} />
          </Stack>
        </CardContent>
        <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
          <Button
            variant="contained"
            onClick={handleUpdateChannel}
            disabled={containerAction.isPending}
          >
            {containerAction.isPending ? "Updating..." : "Update Channel"}
          </Button>
        </CardActions>
      </CippButtonCard>

      <CippButtonCard title="Restart Application">
        <CardContent>
          <Alert severity="info">
            Restart the application container. This will cause a brief downtime while the container
            restarts. If you changed the release channel, this will pull the new image.
          </Alert>
        </CardContent>
        <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleRestart}
            disabled={containerAction.isPending}
          >
            Restart Container
          </Button>
        </CardActions>
      </CippButtonCard>
    </Stack>
  );
};

export default CippContainerManagement;
