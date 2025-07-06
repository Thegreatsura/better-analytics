import { Session } from "@better-analytics/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@better-analytics/ui/components/avatar";

type UserCardProps = {
    session: Session | null;
}

export const UserCard = (props: UserCardProps) => {
    return (
        <div className="flex items-center gap-4">
            <Avatar className="hidden h-9 w-9 sm:flex">
                <AvatarImage
                    src={props.session?.user.image || undefined}
                    alt="Avatar"
                    className="object-cover"
                />
                <AvatarFallback>{props.session?.user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="grid">
                <div className="flex items-center gap-1">
                    <p className="text-sm font-medium leading-none">
                        {props.session?.user.name}
                    </p>
                </div>
                <p className="text-sm">{props.session?.user.email}</p>
            </div>
        </div>
    );
};