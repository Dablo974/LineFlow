import { cn } from '@/lib/utils';
import React from 'react';

export const LineFlowLogo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-2 font-headline text-xl font-bold text-foreground", className)}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <path d="M7 16C9.5 13 12.5 13 15 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 12.5C4 12.5 5.5 11 8 11C11 11 13 13 16 13C18.5 13 20 11.5 20 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 8C9.5 11 12.5 11 15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className="font-headline">LineFlow</span>
  </div>
);
