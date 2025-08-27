'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageShell } from '@/components/blocks/page-shell';
import { useMediaQuery } from '@/hooks/use-media-query';
import { DataTable } from '@/components/ui/data-table';
import { TaskCard } from '@/components/tasks/task-card';
// Backup of current broken state - DO NOT USE