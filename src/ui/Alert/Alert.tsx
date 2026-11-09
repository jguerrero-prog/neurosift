import type { ReactNode } from "react";
import { Button } from "../Button/Button";
import { Icon } from "../Icon/Icon";
import { IconButton } from "../IconButton/IconButton";
import { STATUS_ICONS, liveRole, type Status } from "../status";
import "./Alert.css";

export type AlertStatus = Status;

export type AlertAction =
  | { label: string; onClick: () => void }
  | { label: string; href: string };

interface AlertProps {
  status: AlertStatus;
  title?: string;
  children: ReactNode;
  detail?: string;
  actions?: [AlertAction] | [AlertAction, AlertAction];
  onDismiss?: () => void;
}

export function Alert({
  status,
  title,
  children,
  detail,
  actions,
  onDismiss,
}: AlertProps) {
  return (
    <div className={`ns-alert ns-alert--${status}`} role={liveRole(status)}>
      <span className="ns-alert-icon">
        <Icon name={STATUS_ICONS[status]} size="md" />
      </span>
      <div className="ns-alert-body">
        {title && <p className="ns-alert-title">{title}</p>}
        <div className="ns-alert-message">{children}</div>
        {detail && <code className="ns-alert-detail">{detail}</code>}
        {actions && (
          <div className="ns-alert-actions">
            {actions.map(({ label, ...action }, index) => (
              <Button
                key={label}
                {...action}
                size="sm"
                variant={index === 0 ? "secondary" : "ghost"}
              >
                {label}
              </Button>
            ))}
          </div>
        )}
      </div>
      {onDismiss && (
        <IconButton
          icon="close"
          label="Dismiss"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
        />
      )}
    </div>
  );
}
