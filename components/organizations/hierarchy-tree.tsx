/**
 * Organization Hierarchy Tree Component
 * 
 * Recursive tree visualization of organization hierarchy
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HierarchyNode } from '@/lib/types/rbac';
import { Building2, ChevronRight, ChevronDown, Users, Shield, Eye, Edit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface HierarchyTreeProps {
  node: HierarchyNode;
  level?: number;
  onNodeClick?: (nodeId: string) => void;
}

interface TreeNodeProps {
  node: HierarchyNode;
  level: number;
  onNodeClick?: (nodeId: string) => void;
}

function TreeNode({ node, level, onNodeClick }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const hasChildren = node.children && node.children.length > 0;
  const indentWidth = level * 24; // 24px per level

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleNodeClick = () => {
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  };

  return (
    <div className="select-none">
      {/* Node Row */}
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors group"
        style={{ paddingLeft: `${indentWidth + 12}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={handleToggle}
          className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors ${
            !hasChildren ? 'invisible' : ''
          }`}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )
          )}
        </button>

        {/* Organization Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          node.super_admin_id ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          <Building2 className={`w-4 h-4 ${
            node.super_admin_id ? 'text-blue-600' : 'text-gray-600'
          }`} />
        </div>

        {/* Organization Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleNodeClick}
              className="font-medium text-gray-900 hover:text-blue-600 truncate"
            >
              {node.name}
            </button>
            {node.super_admin_id && (
              <span title="Has Super Admin">
                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
              </span>
            )}
            {!node.is_active && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                Inactive
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
            <span className="capitalize">{node.type}</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {node.member_count}
            </span>
            {node.sub_org_count > 0 && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {node.sub_org_count}
              </span>
            )}
            <span className="text-gray-400">Level {node.depth_level}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/dashboard/organizations/${node.id}`}>
            <Button variant="outline" size="sm" className="h-7 px-2">
              <Eye className="w-3 h-3" />
            </Button>
          </Link>
          <Link href={`/dashboard/organizations/${node.id}/edit`}>
            <Button variant="outline" size="sm" className="h-7 px-2">
              <Edit className="w-3 h-3" />
            </Button>
          </Link>
          {node.depth_level < 4 && (
            <Link href={`/dashboard/organizations/new?parent_org_id=${node.id}`}>
              <Button variant="outline" size="sm" className="h-7 px-2">
                <Plus className="w-3 h-3" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HierarchyTree({ node, level = 0, onNodeClick }: HierarchyTreeProps) {
  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Organization Hierarchy</h3>
        <p className="text-sm text-gray-600 mt-1">
          Expand nodes to view sub-organizations. Maximum depth: 5 levels.
        </p>
      </div>
      <div className="space-y-1">
        <TreeNode node={node} level={level} onNodeClick={onNodeClick} />
      </div>
    </Card>
  );
}

/**
 * Compact Hierarchy Path Component
 * 
 * Shows breadcrumb-style hierarchy path
 */
interface HierarchyPathProps {
  path: Array<{
    id: string;
    name: string;
    depth_level: number;
  }>;
  className?: string;
}

export function HierarchyPath({ path, className = '' }: HierarchyPathProps) {
  if (!path || path.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
      {path.map((org, index) => (
        <div key={org.id} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          <Link
            href={`/dashboard/organizations/${org.id}`}
            className="hover:text-blue-600 hover:underline"
          >
            {org.name}
          </Link>
        </div>
      ))}
    </div>
  );
}

/**
 * Depth Level Indicator
 * 
 * Visual indicator of hierarchy depth with warning for max depth
 */
interface DepthIndicatorProps {
  currentDepth: number;
  maxDepth?: number;
  className?: string;
}

export function DepthIndicator({ currentDepth, maxDepth = 5, className = '' }: DepthIndicatorProps) {
  const isNearMax = currentDepth >= maxDepth - 1;
  const isAtMax = currentDepth >= maxDepth;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">Depth:</span>
      <div className="flex items-center gap-1">
        {Array.from({ length: maxDepth }).map((_, index) => (
          <div
            key={index}
            className={`w-6 h-2 rounded-full ${
              index < currentDepth
                ? isAtMax
                  ? 'bg-red-500'
                  : isNearMax
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className={`text-sm font-medium ${
        isAtMax ? 'text-red-600' : isNearMax ? 'text-yellow-600' : 'text-gray-700'
      }`}>
        {currentDepth} / {maxDepth}
      </span>
      {isAtMax && (
        <span className="text-xs text-red-600 font-medium">
          Maximum depth reached
        </span>
      )}
      {isNearMax && !isAtMax && (
        <span className="text-xs text-yellow-600 font-medium">
          Near maximum depth
        </span>
      )}
    </div>
  );
}
