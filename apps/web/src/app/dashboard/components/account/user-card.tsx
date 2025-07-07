import type { Session } from "@better-analytics/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@better-analytics/ui/components/avatar";
import { Badge } from "@better-analytics/ui/components/badge";
import { CalendarDays, Mail, User as UserIcon } from "lucide-react";

type UserCardProps = {
    session: Session | null;
}

export const UserCard = (props: UserCardProps) => {
    const formatDate = (dateString: string | Date) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* User Profile Section */}
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage
                        src={props.session?.user.image || undefined}
                        alt="Avatar"
                        className="object-cover"
                    />
                    <AvatarFallback className="text-lg">
                        {props.session?.user.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                            {props.session?.user.name || 'Unknown User'}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                            Active
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {props.session?.user.email || 'No email provided'}
                    </div>
                </div>
            </div>

            {/* Account Details Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        User ID
                    </div>
                    <div className="text-sm text-muted-foreground font-mono bg-muted/50 px-3 py-2 rounded-md">
                        {props.session?.user.id || 'Not available'}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        Account Created
                    </div>
                    <div className="text-sm text-muted-foreground font-mono bg-muted/50 px-3 py-2 rounded-md">
                        {props.session?.user.createdAt
                            ? formatDate(props.session.user.createdAt)
                            : 'Not available'
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};