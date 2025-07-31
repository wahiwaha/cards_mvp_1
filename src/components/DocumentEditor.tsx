'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useDebounce } from 'use-debounce';
import { GripVertical, Plus, Image, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface Block {
  id: string;
  type: 'text' | 'image';
  content: string;
  metadata?: {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    alt?: string;
  };
}

interface DocumentData {
  id: string;
  title: string;
  content: {
    blocks: Block[];
  };
  version: number;
  owner_id: string;
  is_public: boolean;
}

interface DocumentEditorProps {
  documentId: string;
  initialData?: DocumentData;
  canEdit?: boolean;
  onSave?: (data: DocumentData) => void;
}

export default function DocumentEditor({ 
  documentId, 
  initialData, 
  canEdit = true,
  onSave 
}: DocumentEditorProps) {
  const [document, setDocument] = useState<DocumentData | null>(initialData || null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced values for auto-save
  const [debouncedTitle] = useDebounce(title, 1000);
  const [debouncedBlocks] = useDebounce(blocks, 1000);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setBlocks(document.content.blocks || []);
    }
  }, [document]);

  // Auto-save effect
  useEffect(() => {
    if (document && canEdit && (debouncedTitle !== document.title || JSON.stringify(debouncedBlocks) !== JSON.stringify(document.content.blocks))) {
      saveDocument();
    }
  }, [debouncedTitle, debouncedBlocks]);

  const saveDocument = async () => {
    if (!document || !canEdit) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          title: debouncedTitle,
          content: { blocks: debouncedBlocks },
          version: document.version,
        }),
      });

      if (response.status === 409) {
        const conflictData = await response.json();
        setError(`Version conflict. Current version: ${conflictData.currentVersion}, your version: ${conflictData.clientVersion}`);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      const { document: updatedDoc } = await response.json();
      setDocument(updatedDoc);
      onSave?.(updatedDoc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (type: 'text' | 'image', index?: number) => {
    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: type === 'text' ? '' : '',
      metadata: type === 'image' ? { 
        position: { x: 0, y: 0 }, 
        size: { width: 300, height: 200 } 
      } : undefined,
    };

    const insertIndex = index !== undefined ? index : blocks.length;
    const newBlocks = [...blocks];
    newBlocks.splice(insertIndex, 0, newBlock);
    setBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const handleImageUpload = async (file: File, blockId: string) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${document?.owner_id}/${documentId}/${blockId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('document-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('document-images')
        .getPublicUrl(fileName);

      updateBlock(blockId, {
        content: publicUrl,
        metadata: {
          ...blocks.find(b => b.id === blockId)?.metadata,
          alt: file.name,
        },
      });

      // Save image metadata to database
      await supabase
        .from('images')
        .upsert({
          id: blockId,
          document_id: documentId,
          storage_path: fileName,
          position: blocks.find(b => b.id === blockId)?.metadata?.position || { x: 0, y: 0 },
          size: blocks.find(b => b.id === blockId)?.metadata?.size || { width: 300, height: 200 },
        });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>, blockId: string, blockIndex: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock('text', blockIndex + 1);
    } else if (e.key === 'Backspace' && e.currentTarget.value === '' && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(blockId);
    }
  };

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedBlockId) return;

    const draggedIndex = blocks.findIndex(b => b.id === draggedBlockId);
    if (draggedIndex === -1 || draggedIndex === targetIndex) return;

    const newBlocks = [...blocks];
    const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, draggedBlock);
    
    setBlocks(newBlocks);
    setDraggedBlockId(null);
  };

  if (!document) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading document...</div>
      </div>
    );
  }

  return (
    <div className="notion-content mx-auto">
      {/* Page Icon */}
      <div className="text-8xl mb-4">📐</div>

      {/* Title */}
      <input
        ref={titleRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        readOnly={!canEdit}
        className="notion-page-title w-full bg-transparent border-none outline-none resize-none mb-8"
      />

      {/* Status indicators */}
      <div className="flex items-center gap-4 mb-8 text-sm text-gray-500">
        {saving && <span>Saving...</span>}
        {error && <span className="text-red-500">{error}</span>}
        {!canEdit && <span className="bg-gray-100 px-2 py-1 rounded">Read-only</span>}
      </div>

      {/* Document blocks */}
      <div className="editor-container">
        {blocks.length === 0 && canEdit && (
          <div 
            className="editor-block group cursor-text py-2"
            onClick={() => addBlock('text')}
          >
            <div className="text-gray-400">Start writing or press / for commands...</div>
          </div>
        )}

        {blocks.map((block, index) => (
          <div
            key={block.id}
            className={`editor-block group ${selectedBlockId === block.id ? 'selected' : ''}`}
            onClick={() => setSelectedBlockId(block.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            {/* Block controls */}
            {canEdit && (
              <div className="block-controls">
                <button
                  className="drag-handle"
                  draggable
                  onDragStart={(e) => handleDragStart(e, block.id)}
                >
                  <GripVertical size={12} />
                </button>
                <button
                  className="ml-1 p-1 hover:bg-gray-100 rounded"
                  onClick={() => addBlock('text', index + 1)}
                >
                  <Plus size={12} />
                </button>
                <button
                  className="ml-1 p-1 hover:bg-gray-100 rounded"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image size={12} />
                </button>
                {blocks.length > 1 && (
                  <button
                    className="ml-1 p-1 hover:bg-gray-100 rounded text-red-500"
                    onClick={() => deleteBlock(block.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Block content */}
            {block.type === 'text' ? (
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, block.id, index)}
                placeholder="Type something..."
                readOnly={!canEdit}
                className="w-full bg-transparent border-none outline-none resize-none notion-text min-h-[24px]"
                rows={1}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            ) : block.type === 'image' && block.content ? (
              <div className={`image-block ${selectedBlockId === block.id ? 'selected' : ''}`}>
                <img
                  src={block.content}
                  alt={block.metadata?.alt || 'Uploaded image'}
                  style={{
                    width: block.metadata?.size?.width || 300,
                    height: block.metadata?.size?.height || 200,
                  }}
                  className="max-w-full h-auto"
                />
                {canEdit && selectedBlockId === block.id && (
                  <div
                    className="image-resize-handle"
                    onMouseDown={(e) => {
                      // Simple resize implementation
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startWidth = block.metadata?.size?.width || 300;
                      const startHeight = block.metadata?.size?.height || 200;

                      const handleMouseMove = (e: MouseEvent) => {
                        const newWidth = startWidth + (e.clientX - startX);
                        const newHeight = startHeight + (e.clientY - startY);
                        
                        updateBlock(block.id, {
                          metadata: {
                            ...block.metadata,
                            size: {
                              width: Math.max(100, newWidth),
                              height: Math.max(100, newHeight),
                            },
                          },
                        });
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />
                )}
              </div>
            ) : block.type === 'image' ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Image size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 mb-4">Click to upload an image</p>
                {canEdit && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="notion-btn-primary"
                  >
                    Upload Image
                  </button>
                )}
              </div>
            ) : null}
          </div>
        ))}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && selectedBlockId) {
              handleImageUpload(file, selectedBlockId);
            }
            e.target.value = '';
          }}
        />
      </div>

      {/* Add block button */}
      {canEdit && (
        <div className="mt-4">
          <button
            onClick={() => addBlock('text')}
            className="notion-btn-ghost text-gray-400 hover:text-gray-600"
          >
            <Plus size={16} className="inline mr-2" />
            Add a block
          </button>
        </div>
      )}
    </div>
  );
}