"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ProjectAccess = {
  level: "owner" | "editor" | "viewer";
  canEdit: boolean;
};

const ProjectAccessContext = createContext<ProjectAccess>({
  level: "viewer",
  canEdit: false,
});

// The Server Component project layout resolves the access level, but only a
// Client Component can actually render a Context.Provider -- this thin
// wrapper is the boundary between the two.
export function ProjectAccessProvider({
  value,
  children,
}: {
  value: ProjectAccess;
  children: ReactNode;
}) {
  return (
    <ProjectAccessContext.Provider value={value}>
      {children}
    </ProjectAccessContext.Provider>
  );
}

export function useProjectAccess() {
  return useContext(ProjectAccessContext);
}
