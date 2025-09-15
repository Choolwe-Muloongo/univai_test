'use client';
import { Bell, Search, LogOut } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';


const roleDetails = {
  student: { name: 'Student', email: 'student@univai.edu', avatar: 'https://i.pravatar.cc/80?u=student' },
  'student-ict': { name: 'ICT Student', email: 'student.ict@univai.edu', avatar: 'https://i.pravatar.cc/80?u=student-ict' },
  'student-business': { name: 'Business Student', email: 'student.business@univai.edu', avatar: 'https://i.pravatar.cc/80?u=student-business' },
  admin: { name: 'Admin', email: 'admin@univai.edu', avatar: 'https://i.pravatar.cc/80?u=admin' },
  lecturer: { name: 'Lecturer', email: 'lecturer@univai.edu', avatar: 'https://i.pravatar.cc/80?u=lecturer' },
  employer: { name: 'Employer', email: 'employer@univai.edu', avatar: 'https://i.pravatar.cc/80?u=employer' },
};

export function AppHeader() {
  const router = useRouter();
  const [user, setUser] = useState({name: '', email: '', avatar: ''});

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'student';
    const schoolId = localStorage.getItem('userSchoolId');
    let userKey = role;
    if (role === 'student' && schoolId) {
        userKey = `student-${schoolId}`;
    }
    setUser(roleDetails[userKey as keyof typeof roleDetails] || roleDetails.student);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userSchoolId');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
