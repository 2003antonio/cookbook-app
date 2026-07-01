const NAV_TABS = [
  { id: "home",     label: "Home",     icon: "⌂"  },
  { id: "recipes",  label: "Recipes",  icon: "📖" },
  { id: "shopping", label: "Shopping", icon: "🛒" },
];

export function BottomNav({ active, onChange, shoppingCount }) {
  const tabs = NAV_TABS.map(tab =>
    tab.id === "shopping" ? { ...tab, badge: shoppingCount } : tab
  );
  const activeIdx = NAV_TABS.findIndex(t => t.id === active);

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      height: "var(--nav-total)", background: "var(--nav-bg)",
      borderTop: "1px solid var(--border)",
      display: "flex", alignItems: "stretch",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.12)",
      zIndex: 80,
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {/* Sliding active-tab highlight — one persistent bar that glides between
          tabs (transform only, compositor-friendly) instead of popping in
          fresh under whichever button is active. */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: `${100 / NAV_TABS.length}%`, height: 2.5,
        display: "flex", justifyContent: "center",
        transform: `translateX(${activeIdx * 100}%)`,
        transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        willChange: "transform",
      }}>
        <div style={{ width: "50%", height: "100%", background: "var(--fire)", borderRadius: "0 0 3px 3px" }} />
      </div>

      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 3,
            color: active === tab.id ? "var(--fire)" : "var(--ink-faint)",
            transition: "color 0.15s", position: "relative",
          }}
        >
          <div style={{ position: "relative" }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{tab.icon}</span>
            {tab.badge > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -8,
                minWidth: 16, height: 16, borderRadius: 999,
                background: "var(--fire)", color: "white",
                fontSize: 9.5, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px",
              }}>{tab.badge}</span>
            )}
          </div>
          <span style={{ fontSize: 10.5, fontWeight: active === tab.id ? 600 : 400, letterSpacing: "0.01em" }}>
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
