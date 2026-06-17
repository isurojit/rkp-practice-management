import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  Clock3,
  BarChart3,
  ReceiptText,
} from "lucide-react";

export const navigation = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Employees",
    url: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Clients",
    url: "/dashboard/clients",
    icon: Building2,
  },
  {
    title: "Assignments",
    url: "/dashboard/assignments",
    icon: FolderKanban,
  },
  {
    title: "Timesheets",
    url: "/dashboard/timesheets",
    icon: Clock3,
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    title: "Invoices",
    url: "/dashboard/invoices",
    icon: ReceiptText,
  },
];
