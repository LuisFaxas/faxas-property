'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProjects } from '@/hooks/use-api';
import { useAuth } from '@/app/contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  status: string;
  projectType?: string;
  description?: string;
  color?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  clientName?: string;
  address?: string;
  totalBudget?: number;
  _count?: {
    tasks?: number;
    contacts?: number;
    budgets?: number;
    schedule?: number;
    procurement?: number;
  };
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  isLoading: boolean;
  error: any;
  refetchProjects: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Wait for auth to be ready
  useEffect(() => {
    if (!authLoading && user) {
      setTimeout(() => setIsReady(true), 500);
    }
  }, [authLoading, user]);
  
  // Fetch projects
  const { 
    data: projectsData, 
    isLoading, 
    error,
    refetch: refetchProjects 
  } = useProjects(isReady);
  
  const projects = projectsData?.data || projectsData || [];
  
  // Set default project when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && !currentProjectId) {
      // Try to get from localStorage first
      const savedProjectId = localStorage.getItem('selectedProjectId');
      const savedProject = projects.find((p: Project) => p.id === savedProjectId);

      if (savedProject && !savedProject.isArchived) {
        setCurrentProjectId(savedProjectId);
      } else {
        // Always select first active project for consistent behavior
        const activeProject = projects.find((p: Project) => !p.isArchived);
        const defaultProject = activeProject || projects[0];

        if (defaultProject) {
          setCurrentProjectId(defaultProject.id);
          localStorage.setItem('selectedProjectId', defaultProject.id);
        }
      }
    }
  }, [projects, currentProjectId]);
  
  // Save current project to localStorage
  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('selectedProjectId', currentProjectId);
    }
  }, [currentProjectId]);
  
  const currentProject = projects.find((p: Project) => p.id === currentProjectId) || null;
  
  const value = {
    projects,
    currentProject,
    currentProjectId,
    setCurrentProjectId,
    isLoading,
    error,
    refetchProjects,
  };
  
  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
}