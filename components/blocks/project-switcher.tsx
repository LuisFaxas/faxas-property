'use client';

import { useState } from 'react';
import { 
  Building2, 
  Check, 
  ChevronsUpDown, 
  Plus,
  Star,
  Archive,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useProjectContext } from '@/app/contexts/ProjectContext';
import { useRouter } from 'next/navigation';

export function ProjectSwitcher() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { 
    projects, 
    currentProject, 
    currentProjectId, 
    setCurrentProjectId,
    isLoading 
  } = useProjectContext();
  
  const activeProjects = projects.filter(p => !p.isArchived);
  const archivedProjects = projects.filter(p => p.isArchived);
  const favoriteProjects = activeProjects.filter(p => p.isFavorite);
  
  const handleProjectSelect = (projectId: string) => {
    setCurrentProjectId(projectId);
    setOpen(false);
  };
  
  const handleCreateNew = () => {
    setOpen(false);
    router.push('/admin/settings?tab=projects&action=new');
  };
  
  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'PLANNING': return 'bg-gray-500';
      case 'ON_HOLD': return 'bg-yellow-500';
      case 'COMPLETED': return 'bg-blue-500';
      case 'ARCHIVED': return 'bg-gray-400';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between glass-card border-white/10 text-white hover:bg-white/10"
        >
          {currentProject ? (
            <div className="flex items-center gap-2 truncate">
              {currentProject.color && (
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: currentProject.color }}
                />
              )}
              <span className="truncate">{currentProject.name}</span>
              {currentProject.isFavorite && (
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              )}
            </div>
          ) : (
            <span className="text-white/50">Select project...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 glass-card">
        <Command>
          <CommandInput 
            placeholder="Search projects..." 
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No projects found.</CommandEmpty>
            
            {/* Favorite Projects */}
            {favoriteProjects.length > 0 && (
              <>
                <CommandGroup heading="Favorites">
                  {favoriteProjects.map((project) => (
                    <CommandItem
                      key={project.id}
                      value={project.name}
                      onSelect={() => handleProjectSelect(project.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {project.color && (
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          />
                        )}
                        <span className="flex-1 truncate">{project.name}</span>
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs h-5",
                            getProjectStatusColor(project.status),
                            "text-white border-0"
                          )}
                        >
                          {project.status}
                        </Badge>
                        {currentProjectId === project.id && (
                          <Check className="h-4 w-4 text-accent-500" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            
            {/* Active Projects */}
            <CommandGroup heading="All Projects">
              {activeProjects.filter(p => !p.isFavorite).map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name}
                  onSelect={() => handleProjectSelect(project.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1">
                    {project.color && (
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                    )}
                    <span className="flex-1 truncate">{project.name}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs h-5",
                        getProjectStatusColor(project.status),
                        "text-white border-0"
                      )}
                    >
                      {project.status}
                    </Badge>
                    {currentProjectId === project.id && (
                      <Check className="h-4 w-4 text-accent-500" />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            
            {/* Archived Projects */}
            {archivedProjects.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Archived">
                  {archivedProjects.map((project) => (
                    <CommandItem
                      key={project.id}
                      value={project.name}
                      onSelect={() => handleProjectSelect(project.id)}
                      className="cursor-pointer opacity-60"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Archive className="h-3 w-3" />
                        <span className="flex-1 truncate">{project.name}</span>
                        {currentProjectId === project.id && (
                          <Check className="h-4 w-4 text-accent-500" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={handleCreateNew}
                className="cursor-pointer text-accent-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Project
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}