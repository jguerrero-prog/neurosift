import ErrorBoundary from "@components/ErrorBoundary";
import StatusBar from "@components/StatusBar";
import "@css/App.css";
import { useWindowDimensions } from "@fi-sci/misc";
import { CircularProgress } from "@mui/material";
import { AppBar } from "@ui";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { lazy, Suspense, useEffect } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { AIComponentRegistryProvider } from "./ai-integration/AIComponentRegistry";
import { sendUrlUpdate } from "./ai-integration/messaging/windowMessaging";
import { logPageLoad } from "./util/sendLog";
import { v1Url } from "./util/v1Url";

// Each page is its own chunk, so a visit downloads only the page it lands on.
const DandisetPageContainer = lazy(
  () => import("./pages/DandisetPage/DandisetPageContainer"),
);
const EdfPage = lazy(() => import("./pages/EdfPage/EdfPage"));
const EmberDandisetPageContainer = lazy(
  () => import("./pages/EmberDandisetPage/EmberDandisetPageContainer"),
);
const GuidePage = lazy(() => import("./pages/GuidePage/GuidePage"));
const HomePage = lazy(() => import("./pages/HomePage/HomePage"));
const NwbPage = lazy(() => import("./pages/NwbPage/NwbPage"));
const OpenNeuroDatasetPage = lazy(
  () => import("./pages/OpenNeuroDatasetPage/OpenNeuroDatasetPage"),
);
const SearchPage = lazy(() => import("./pages/SearchPage/SearchPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage/SettingsPage"));
const SlpPage = lazy(() => import("./pages/SlpPage/SlpPage"));
const VideoPage = lazy(() => import("./pages/VideoPage/VideoPage"));

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2c3e50",
      dark: "#1a2530",
      light: "#3e5771",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#9c27b0",
      dark: "#7b1fa2",
      light: "#ba68c8",
      contrastText: "#ffffff",
    },
    text: {
      primary: "rgb(33, 33, 33)",
      secondary: "rgb(66, 66, 66)",
    },
    background: {
      default: "rgb(250, 250, 250)",
      paper: "#ffffff",
    },
  },
});

const LegacyUrlHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const p = searchParams.get("p");
    if (!p) return;

    let newPath = "";
    let newSearch = "";

    if (p === "/dandi") {
      newPath = "/dandi";
    } else if (p === "/dandiset") {
      const dandisetId = searchParams.get("dandisetId");
      const dandisetVersion = searchParams.get("dandisetVersion");
      if (dandisetId) {
        newPath = `/dandiset/${dandisetId}`;
        if (dandisetVersion) {
          newSearch = `?dandisetVersion=${dandisetVersion}`;
        }
      }
    } else if (p === "/ember") {
      newPath = "/ember";
    } else if (p === "/ember-dandiset") {
      const emberDandisetId = searchParams.get("emberDandisetId");
      const emberDandisetVersion = searchParams.get("emberDandisetVersion");
      if (emberDandisetId) {
        newPath = `/ember-dandiset/${emberDandisetId}`;
        if (emberDandisetVersion) {
          newSearch = `?ember-dandisetVersion=${emberDandisetVersion}`;
        }
      }
    } else if (p === "/edf") {
      newPath = "/edf";
      const urlParam = searchParams.get("url");
      const versionParam = searchParams.get("versionId");
      if (urlParam) {
        newSearch = `?url=${urlParam}${versionParam ? `&versionId=${versionParam}` : ""}`;
      }
    } else if (p === "/nwb") {
      newPath = "/nwb";
      const urlParam = searchParams.get("url");
      const tabParam = searchParams.get("tab");

      // Handle encoded parameters
      const params = new URLSearchParams();
      ["dandisetId", "dandisetVersion"].forEach((param) => {
        const value = searchParams.get(param);
        if (value) params.append(param, value);
      });

      // Build query string with parameters in specific order
      const queryParts = [];

      // 1. url (unencoded)
      if (urlParam) queryParts.push(`url=${urlParam}`);

      // 2. dandisetId
      const dandisetId = searchParams.get("dandisetId");
      if (dandisetId)
        queryParts.push(`dandisetId=${encodeURIComponent(dandisetId)}`);

      // 3. dandisetVersion
      const dandisetVersion = searchParams.get("dandisetVersion");
      if (dandisetVersion)
        queryParts.push(
          `dandisetVersion=${encodeURIComponent(dandisetVersion)}`,
        );

      // 4. tab
      if (tabParam?.startsWith("neurodata-item:")) {
        const path = tabParam.split("|")[0].replace("neurodata-item:", "");
        queryParts.push(`tab=${path}`);
      }
      if (tabParam?.startsWith("view:")) {
        const b = tabParam.slice("view:".length).split("|");
        if (b[0] === "X/Y") {
          queryParts.push(`tab=SpatialSeriesXY|${b[1]}`);
        }
      }
      if (tabParam?.startsWith("neurodata-items:")) {
        const x = tabParam.slice("neurodata-items:".length).split("@");
        let y = x.map((z) => {
          if (z.startsWith("neurodata-item")) {
            const b = z.slice("neurodata-item:".length).split("|");
            return b[0];
          } else if (z.startsWith("view:")) {
            const b = z.slice("view:".length).split("|");
            if (b[0] === "X/Y") {
              return `SpatialSeriesXY|${b[1]}`;
            } else if (b[0] === "RasterPlot") {
              return `Raster|${b[1]}`;
            }
          }
          return "";
        });
        y = y.filter((z) => z !== "");
        queryParts.push(`tab=${JSON.stringify(y)}`);
      }

      if (queryParts.length > 0) {
        newSearch = "?" + queryParts.join("&");
      }
    }

    if (newPath) {
      // Preserve embedded=1 if present
      const hideParam = searchParams.get("embedded");
      if (hideParam === "1") {
        if (newSearch) {
          newSearch += "&embedded=1";
        } else {
          newSearch = "?embedded=1";
        }
      }
      navigate(newPath + newSearch, { replace: true });
    }
  }, [location, searchParams, navigate]);

  return null;
};

const PageLoading = () => (
  <div style={{ padding: 20 }}>
    <CircularProgress />
  </div>
);

const AppContent = () => {
  const [searchParams] = useSearchParams();

  // useRegisterAIComponent({ navigate });

  const location = useLocation();

  // Log initial page load
  useEffect(() => {
    const fullUrl =
      window.location.protocol +
      "//" +
      window.location.host +
      location.pathname +
      location.search;
    logPageLoad(fullUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    // send to neurosift-chat
    sendUrlUpdate(
      window.location.protocol +
        "//" +
        window.location.host +
        location.pathname +
        location.search,
    );
  }, [location]);

  const { width, height } = useWindowDimensions();
  const hideAppBar = searchParams.get("embedded") === "1";
  const appBarHeight = hideAppBar ? 0 : 48; // layout/appbar-height
  const statusBarHeight = 20;
  const mainHeight = height - appBarHeight - statusBarHeight;
  return (
    <div
      className="AppContentDiv"
      style={{ position: "absolute", width, height, overflow: "hidden" }}
    >
      {!hideAppBar && (
        <div
          className="AppBarDiv"
          style={{
            position: "absolute",
            width,
            height: appBarHeight,
            overflow: "hidden",
          }}
        >
          <AppBar
            homeHref={import.meta.env.BASE_URL}
            logo={
              <img
                src={`${import.meta.env.BASE_URL}neurosift-logo.png`}
                alt=""
                className="app-bar-logo"
              />
            }
            actions={[
              {
                label: "Guide",
                href: `${import.meta.env.BASE_URL}guide`,
                icon: "help",
              },
              {
                label: "Report a problem on GitHub",
                href: "https://github.com/flatironinstitute/neurosift/issues",
                icon: "logo--github",
                iconOnly: true,
                external: true,
              },
              {
                label: "Settings",
                href: `${import.meta.env.BASE_URL}settings`,
                icon: "settings",
                iconOnly: true,
              },
              {
                label: "Open in Neurosift v1",
                href: v1Url(location.pathname, location.search),
                icon: "launch",
              },
            ]}
          />
        </div>
      )}

      <div
        className="AppContentMainDiv"
        style={{
          position: "absolute",
          width,
          height: mainHeight,
          overflow: "hidden",
          top: appBarHeight,
        }}
      >
        <ErrorBoundary what="this page" resetKey={location.key}>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route
                path="/"
                element={<HomePage width={width} height={mainHeight} />}
              />
              <Route
                path="/search"
                element={<SearchPage width={width} height={mainHeight} />}
              />
              <Route
                path="/dandi"
                element={
                  <SearchPage
                    width={width}
                    height={mainHeight}
                    archive="DANDI"
                  />
                }
              />
              <Route
                path="/dandiset/:dandisetId"
                element={
                  <DandisetPageContainer width={width} height={mainHeight} />
                }
              />
              <Route
                path="/ember"
                element={
                  <SearchPage
                    width={width}
                    height={mainHeight}
                    archive="EMBER"
                  />
                }
              />
              <Route
                path="/ember-dandiset/:dandisetId"
                element={
                  <EmberDandisetPageContainer
                    width={width}
                    height={mainHeight}
                  />
                }
              />
              <Route
                path="/openneuro"
                element={
                  <SearchPage
                    width={width}
                    height={mainHeight}
                    archive="OpenNeuro"
                  />
                }
              />
              <Route
                path="/openneuro-dataset/:datasetId"
                element={
                  <OpenNeuroDatasetPage width={width} height={mainHeight} />
                }
              />
              <Route
                path="/nwb"
                element={<NwbPage width={width} height={mainHeight} />}
              />
              <Route path="/settings" element={<SettingsPage />} />
              <Route
                path="/guide"
                element={<GuidePage width={width} height={mainHeight} />}
              />
              <Route
                path="/edf"
                element={<EdfPage width={width} height={mainHeight} />}
              />
              <Route
                path="/video"
                element={<VideoPage width={width} height={mainHeight} />}
              />
              <Route
                path="/slp"
                element={<SlpPage width={width} height={mainHeight} />}
              />
              <Route
                path="/experimental-neurotile"
                element={
                  <Navigate to="/experimental-neurosift-tiles" replace />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>

      <div
        className="StatusBarDiv"
        style={{
          position: "absolute",
          width,
          height: statusBarHeight,
          overflow: "hidden",
          top: appBarHeight + mainHeight,
        }}
      >
        <StatusBar />
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router basename={import.meta.env.BASE_URL}>
        <AIComponentRegistryProvider>
          <LegacyUrlHandler />
          <AppContent />
        </AIComponentRegistryProvider>
      </Router>
    </ThemeProvider>
  );
}

// const useRegisterAIComponent = ({
//   navigate,
// }: {
//   navigate: NavigateFunction;
// }) => {
//   const { registerComponentForAI, unregisterComponentForAI } =
//     useAIComponentRegistry();

//   useEffect(() => {
//     const registration: AIRegisteredComponent = {
//       id: "App",
//       context: aiContextDescription,
//       callbacks: [
//         {
//           id: "navigate",
//           description: `
// Navigate to a specific page.

// / - Home page
// /dandi - DANDI Archive
// /dandiset/:dandisetId - Dandiset page
// /nwb?dandisetId=:dandisetId&dandisetVersion=:dandisetVersion&url=:url - NWB page
// /openneuro - OpenNeuro page
// /openneuro-dataset/:datasetId - OpenNeuro dataset page
// /settings - Settings page
// `,
//           parameters: {
//             path: {
//               type: "string",
//               description: "Path to navigate to",
//             },
//           },
//           callback: ({ path }: { path: string }) => {
//             navigate(path);
//           },
//         },
//       ],
//     };
//     registerComponentForAI(registration);
//     return () => unregisterComponentForAI("App");
//   }, [registerComponentForAI, unregisterComponentForAI, navigate]);
// };

// const aiContextDescription = `
// The user can click the Neurosift logo or title to navigate to the home page.
// The user can click the Settings icon in the upper right part of the window to navigate to the settings page where they can configure Neurosift including setting API keys.
// `;

export default App;
