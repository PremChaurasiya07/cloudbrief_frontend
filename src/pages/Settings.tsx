import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { useUserCred } from "@/context/usercred";

interface ServiceConnection {
  name: string;
  icon: string;
  connected: boolean;
  accountIds?: string[];
}

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { userid } = useUserCred(); // Move to top level

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [connectedSources, setConnectedSources] = useState<string[]>([]);
  const [gmailAccounts, setGmailAccounts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        // Fetch all sources for this user
        const { data: sourceData, error: sourceError } = await supabase
          .from("memory_entries")
          .select("source")
          .eq("user_id", userid);

        if (sourceError) {
          console.error(sourceError);
          setIsLoading(false);
          return;
        }

        let sources = Array.from(new Set(sourceData?.map(entry => entry.source) || []));

        // If Gmail accounts exist, fetch them
        let gmailIds: string[] = [];
        if (sources.includes("gmail")) {
          const { data: gmailData, error: gmailError } = await supabase
            .from("email_auth")
            .select("gmail_id")
            .eq("user_id", userid);

          if (gmailError) {
            console.error(gmailError);
          } else {
            gmailIds = gmailData?.map(entry => entry.gmail_id) || [];
            setGmailAccounts(gmailIds);
          }
        }

        // If Gmail accounts found, also mark calendar as connected
        if (gmailIds.length > 0 && !sources.includes("calendar")) {
          sources = [...sources, "calendar"];
        }

        setConnectedSources(sources);
      } catch (error) {
        console.error("Error fetching connections:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userid) {
      fetchConnections();
    }
  }, [userid]);

  const services: ServiceConnection[] = [
    {
      name: "WhatsApp",
      icon: "💬",
      connected: connectedSources.includes("whatsapp"),
    },
    {
      name: "Gmail",
      icon: "📧",
      connected: gmailAccounts.length > 0,
      accountIds: gmailAccounts,
    },
   {
      name: "Google Calendar",
      icon: "📅",
      connected: connectedSources.includes("calendar"),
      accountIds: gmailAccounts.length > 0 ? gmailAccounts : undefined, // show gmail IDs here also
    },

    // {
    //   name: "Twitter",
    //   icon: "🐦",
    //   connected: connectedSources.includes("twitter"),
    // },
    // {
    //   name: "LinkedIn",
    //   icon: "👔",
    //   connected: connectedSources.includes("linkedin"),
    // },
  ];

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-6 flex flex-wrap gap-2">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <div className="grid gap-6">
            <ProfileCard />
            {/* <PasswordCard /> */}
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsCard
            notificationsEnabled={notificationsEnabled}
            soundEnabled={soundEnabled}
            emailDigest={emailDigest}
            onNotificationsChange={setNotificationsEnabled}
            onSoundChange={setSoundEnabled}
            onEmailDigestChange={setEmailDigest}
          />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceCard theme={theme} setTheme={setTheme} />
        </TabsContent>

        <TabsContent value="connections">
          <ConnectionsCard services={services} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ProfileCard = () => (
  <Card>
    <CardHeader>
      <CardTitle>Profile</CardTitle>
      <CardDescription>Manage your profile information</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src="https://i.pravatar.cc/300" alt="User" />
          <AvatarFallback>CU</AvatarFallback>
        </Avatar>
        <div>
          <Button variant="outline" size="sm" className="mb-2">
            Upload new photo
          </Button>
          <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size 1MB.</p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="Cloud User" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="user@example.com" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Input id="bio" defaultValue="Productivity enthusiast using CloudBrief OS" />
        </div>
        <Button className="w-fit">Save changes</Button>
      </div>
    </CardContent>
  </Card>
);

// const PasswordCard = () => (
//   <Card>
//     <CardHeader>
//       <CardTitle>Password</CardTitle>
//       <CardDescription>Update your password</CardDescription>
//     </CardHeader>
//     <CardContent className="space-y-4">
//       {["current-password", "new-password", "confirm-password"].map((id, idx) => (
//         <div className="space-y-2" key={id}>
//           <Label htmlFor={id}>
//             {["Current", "New", "Confirm"][idx]} password
//           </Label>
//           <Input id={id} type="password" />
//         </div>
//       ))}
//       <Button className="w-fit">Update password</Button>
//     </CardContent>
//   </Card>
// );

const NotificationsCard = ({
  notificationsEnabled,
  soundEnabled,
  emailDigest,
  onNotificationsChange,
  onSoundChange,
  onEmailDigestChange,
}: {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  emailDigest: boolean;
  onNotificationsChange: (checked: boolean) => void;
  onSoundChange: (checked: boolean) => void;
  onEmailDigestChange: (checked: boolean) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Notification Settings</CardTitle>
      <CardDescription>Configure how you want to receive notifications</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <SwitchRow
        id="notifications"
        label="Enable notifications"
        description="Receive notifications about updates and activity"
        checked={notificationsEnabled}
        onCheckedChange={onNotificationsChange}
      />
      <SwitchRow
        id="sounds"
        label="Notification sounds"
        description="Play a sound when you receive notifications"
        checked={soundEnabled}
        onCheckedChange={onSoundChange}
      />
      <SwitchRow
        id="email-digest"
        label="Email digest"
        description="Receive a daily summary of your activity"
        checked={emailDigest}
        onCheckedChange={onEmailDigestChange}
      />
    </CardContent>
  </Card>
);

const SwitchRow = ({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between">
    <Label htmlFor={id} className="flex flex-col">
      <span>{label}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </Label>
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

const AppearanceCard = ({
  theme,
  setTheme,
}: {
  theme: string;
  setTheme: (theme: string) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Appearance</CardTitle>
      <CardDescription>Customize the look and feel of CloudBrief OS</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Label>Theme Mode</Label>
        <div className="flex flex-wrap gap-4">
          {[
            { value: "light", label: "Light", bg: "bg-[#f8f9fa]" },
            { value: "dark", label: "Dark", bg: "bg-[#1a1a24]" },
            { value: "system", label: "System", bg: "bg-gradient-to-r from-[#f8f9fa] to-[#1a1a24]" },
          ].map(option => (
            <ThemeOption
              key={option.value}
              value={option.value}
              label={option.label}
              bg={option.bg}
              selected={theme === option.value}
              onClick={() => setTheme(option.value)}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label className="flex flex-col">
          <span>Quick Toggle</span>
          <span className="text-sm text-muted-foreground">
            Toggle between light and dark themes quickly
          </span>
        </Label>
        <ThemeToggle />
      </div>
    </CardContent>
  </Card>
);

const ThemeOption = ({
  value,
  label,
  bg,
  selected,
  onClick,
}: {
  value: string;
  label: string;
  bg: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <Button
    variant="outline"
    size="sm"
    className={`${
      selected ? "border-primary" : ""
    } ${bg} text-primary-600`}
    onClick={onClick}
  >
    {label}
  </Button>
);

const ConnectionsCard = ({
  services,
  isLoading,
}: {
  services: ServiceConnection[];
  isLoading: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Connections</CardTitle>
      <CardDescription>Manage your connected accounts and services</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        services.map(service => (
          <div key={service.name} className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span>{service.icon}</span>
                <span>{service.name}</span>
              </div>
              <Button
                className={
                  service.connected
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }
                disabled={!service.connected}
                size="sm"
              >
                {service.connected ? "Connected" : "Not Connected"}
              </Button>
            </div>
            {(service.name === "Gmail"|| service.name === "Google Calendar") && service.accountIds?.length ? (
              <div className="flex flex-wrap gap-2 pl-8">
                {service.accountIds.map((id) => (
                  <span
                    key={id}
                    className="px-2 py-1 text-sm rounded-md bg-muted text-muted-foreground"
                  >
                    {id}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))
      )}
    </CardContent>
  </Card>
);


export default Settings;
