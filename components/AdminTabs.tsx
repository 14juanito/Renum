import { Tabs } from "./ui";
export function AdminTabs({ current, admin }: { current: string; admin: boolean }) {
  const items = [
    { href: "/admin", label: "Vue d'ensemble" },
    { href: "/admin/validation", label: "Validation" },
    { href: "/admin/ia", label: "Module IA" },
    { href: "/evenement", label: "Événement" },
    { href: "/admin/import", label: "Import secours" },
    ...(admin ? [{ href: "/admin/utilisateurs", label: "Utilisateurs" }, { href: "/admin/parametres", label: "Paramètres" }, { href: "/admin/audit", label: "Journal d'audit" }] : [{ href: "/admin/utilisateurs", label: "Saisie assistée" }, { href: "/admin/audit", label: "Journal d'audit" }]),
  ];
  return <Tabs items={items} current={current} />;
}
