export type VideoProviderConnection = {
  provider: string;
  root: HTMLElement;
  disconnect(): void;
};

export type VideoProviderAdapter = {
  key: string;
  connect(host: HTMLElement): VideoProviderConnection | null;
};

type PlaybackController = {
  paused(): boolean;
  pause(): void;
  play(): unknown;
};

function markLayer(root: ParentNode, selector: string, layer: "media" | "ad" | "controls", interactive = false) {
  root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    element.dataset.videoLayer = layer;
    if (interactive) element.dataset.videoInteractive = "true";
  });
}

function mapAdsConexLayers(root: HTMLElement) {
  root.dataset.videoSurface = "true";
  markLayer(root, "video, .vjs-tech", "media");
  markLayer(root, ".ima-ad-container", "ad");
  markLayer(root, ".vjs-control-bar", "controls", true);
  markLayer(root, ".vjs-control", "controls", true);
}

function installAdsConexPlaybackIntentGuard(host: HTMLElement) {
  const preservePlaybackIntent = (event: TouchEvent) => {
    const target = event.target;
    if (!(target instanceof Element) || !host.contains(target)) return;
    const control = target.closest<HTMLElement>("[data-video-interactive='true']");
    const playControl = target.closest(".vjs-play-control");
    const video = control && host.querySelector<HTMLVideoElement>("video");
    const player = (window as Window & { playerAdsconex?: PlaybackController }).playerAdsconex;
    if (!control || (!player && !video)) return;
    const paused = player ? player.paused() : video!.paused;
    const shouldPause = playControl ? !paused : paused;
    window.setTimeout(() => {
      if (player) {
        if (player.paused() === shouldPause) return;
        if (shouldPause) player.pause();
        else void Promise.resolve(player.play()).catch(() => undefined);
        return;
      }
      if (!video?.isConnected || video.paused === shouldPause) return;
      if (shouldPause) video.pause();
      else void video.play().catch(() => undefined);
    }, 150);
  };
  document.addEventListener("touchstart", preservePlaybackIntent, { capture: true, passive: true });
  return () => document.removeEventListener("touchstart", preservePlaybackIntent, true);
}

const adsConexAdapter: VideoProviderAdapter = {
  key: "adsconex",
  connect(host) {
    const root = host.querySelector<HTMLElement>("#adsconex-video-container");
    if (!root) return null;
    host.dataset.videoProvider = this.key;
    mapAdsConexLayers(root);
    const observer = new MutationObserver(() => mapAdsConexLayers(root));
    observer.observe(root, { childList: true, subtree: true });
    const removePlaybackGuard = installAdsConexPlaybackIntentGuard(host);
    return {
      provider: this.key,
      root,
      disconnect() {
        observer.disconnect();
        removePlaybackGuard();
      },
    };
  },
};

const adapters: VideoProviderAdapter[] = [adsConexAdapter];

/** Provider-specific DOM knowledge ends at this registry boundary. */
export function connectVideoProvider(host: HTMLElement) {
  for (const adapter of adapters) {
    const connection = adapter.connect(host);
    if (connection) return connection;
  }
  return null;
}
