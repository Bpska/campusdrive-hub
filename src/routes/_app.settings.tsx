import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    updateUser(name.trim());
    toast.success("Profile updated");
  };

  // Listen for Ctrl+S / Cmd+S to save settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [name]);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile and preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input defaultValue={user?.email} readOnly />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Input defaultValue={user?.role} readOnly />
            </div>
            <Button onClick={handleSave}>Save changes</Button>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {[
              "Email me when a new lead is assigned",
              "Daily call summary",
              "Visit reminders 1 hour before",
              "Follow-up due alerts",
            ].map((label, i) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <div className="text-sm text-foreground">{label}</div>
                <Switch defaultChecked={i % 2 === 0} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}