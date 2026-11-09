import { Alert } from "@ui";
import { useNavigate } from "react-router-dom";
import "./AuthErrorNotification.css";

interface AuthErrorNotificationProps {
  dandiUrl?: string;
}

/** Shown when DANDI refuses a file because the Dandiset is embargoed and no key, or the wrong key, was sent. */
const AuthErrorNotification = ({ dandiUrl }: AuthErrorNotificationProps) => {
  const navigate = useNavigate();
  const sandbox = dandiUrl?.includes("api.sandbox.dandiarchive.org");
  const archive = sandbox ? "DANDI sandbox" : "DANDI";
  return (
    <div className="auth-error-notification">
      <Alert
        status="warning"
        title="This Dandiset is embargoed"
        actions={[
          { label: "Add API key", onClick: () => navigate("/settings") },
          {
            label: sandbox
              ? "Get a key on the DANDI sandbox"
              : "Get a key on DANDI",
            href: sandbox
              ? "https://gui-staging.dandiarchive.org"
              : "https://dandiarchive.org",
            newTab: true,
          },
        ]}
      >
        Add a {archive} API key from an account with access to open its files.
      </Alert>
    </div>
  );
};

export default AuthErrorNotification;
