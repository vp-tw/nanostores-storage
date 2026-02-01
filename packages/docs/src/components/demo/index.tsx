import type { LucideIcon } from "lucide-react";
import { ExternalLink } from "lucide-react";
import * as React from "react";

import { Button } from "../Button";

// ============================================
// Layout Components
// ============================================

export const DemoStack: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="demo-stack">{children}</div>
);

export const DemoContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="demo-container">{children}</div>
);

export const DemoRow: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div className="demo-row" style={style}>
    {children}
  </div>
);

export const DemoRowBetween: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="demo-row-between">{children}</div>
);

// ============================================
// Typography Components
// ============================================

export type BadgeVariant = "green" | "purple" | "gray";

export const Badge: React.FC<{
  variant: BadgeVariant;
  children: React.ReactNode;
}> = ({ variant, children }) => <span className={`badge badge-${variant}`}>{children}</span>;

export const DemoTitle: React.FC<{
  icon?: LucideIcon;
  badge?: { variant: BadgeVariant; children: React.ReactNode };
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ icon: Icon, badge, children, style }) => (
  <h3 className="demo-title" style={style}>
    {Icon && <Icon className="w-5 h-5" style={{ marginRight: "0.5rem" }} />}
    {children}
    {badge && <Badge variant={badge.variant}>{badge.children}</Badge>}
  </h3>
);

export const DemoText: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <p className="demo-text" style={style}>
    {children}
  </p>
);

export const DemoTextSm: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <p className="demo-text-sm" style={style}>
    {children}
  </p>
);

export const DemoLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="demo-label">{children}</label>
);

// ============================================
// Tabs Component
// ============================================

export interface TabItem<T extends string> {
  key: T;
  label: React.ReactNode;
  count?: number;
}

export function DemoTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  style,
}: {
  tabs: Array<TabItem<T>>;
  activeTab: T;
  onTabChange: (tab: T) => void;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <div className="demo-tabs" style={style}>
      {tabs.map((tab) => (
        <Button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`demo-tab ${activeTab === tab.key ? "active" : ""}`}
        >
          {tab.label}
          {tab.count !== undefined && <span className="demo-tab-count">{tab.count}</span>}
        </Button>
      ))}
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================

export const DemoEmpty: React.FC<{
  icon: LucideIcon;
  title: string;
  text?: string;
  style?: React.CSSProperties;
}> = ({ icon: Icon, title, text, style }) => (
  <div className="demo-empty" style={style}>
    <Icon className="demo-empty-icon" />
    <p className="demo-empty-title">{title}</p>
    {text && <p className="demo-empty-text">{text}</p>}
  </div>
);

// ============================================
// Info Box Component
// ============================================

export const DemoInfo: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="demo-info">
    <h4 className="demo-info-title">{title}</h4>
    {children}
  </div>
);

export const DemoInfoNote: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div
    style={{
      marginTop: "0.75rem",
      padding: "0.75rem",
      background: "hsl(45, 90%, 95%)",
      borderRadius: "0.375rem",
      border: "1px solid hsl(45, 80%, 70%)",
    }}
  >
    <p style={{ margin: 0, fontSize: "0.875rem", color: "hsl(45, 70%, 25%)" }}>{children}</p>
  </div>
);

export const GithubSourceLink: React.FC<{ href: string }> = ({ href }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.375rem",
      marginTop: "0.75rem",
      color: "var(--sl-color-text-accent)",
    }}
  >
    <ExternalLink className="w-4 h-4" />
    View full implementation example
  </a>
);

// ============================================
// Form Components
// ============================================

export const DemoInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & {
    inputStyle?: React.CSSProperties;
  }
> = ({ inputStyle, style, className, ...props }) => (
  <input
    className={`demo-input ${className ?? ""}`}
    style={{ ...style, ...inputStyle }}
    {...props}
  />
);

export const DuplicateWarning: React.FC<{
  show: boolean;
  message?: string;
}> = ({ show, message = "Already exists" }) =>
  show ? (
    <DemoTextSm style={{ color: "hsl(0, 72%, 60%)", marginBottom: "1rem" }}>{message}</DemoTextSm>
  ) : null;

// ============================================
// Table Components
// ============================================

export const StorageTable: React.FC<{
  headers: Array<string>;
  children: React.ReactNode;
}> = ({ headers, children }) => (
  <table className="storage-table">
    <thead>
      <tr>
        {headers.map((header, i) => (
          <th key={header} className={i === headers.length - 1 ? "action-cell" : undefined}>
            {header}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>{children}</tbody>
  </table>
);

export const KeyCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="key-cell">{children}</td>
);

export const ValueCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="value-cell">{children}</td>
);

export const ActionCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="action-cell">
    <DemoRow>{children}</DemoRow>
  </td>
);

// ============================================
// Icon Button Component
// ============================================

export const IconButton: React.FC<{
  icon: LucideIcon;
  onClick: () => void;
  title: string;
  variant?: "default" | "active" | "danger";
}> = ({ icon: Icon, onClick, title, variant = "default" }) => {
  const className =
    variant === "danger"
      ? "demo-icon-button danger"
      : variant === "active"
        ? "demo-icon-button active"
        : "demo-icon-button";

  return (
    <Button onClick={onClick} className={className} title={title}>
      <Icon className="w-4 h-4" />
    </Button>
  );
};
