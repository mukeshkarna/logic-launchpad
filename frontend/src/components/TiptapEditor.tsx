'use client';

import { useEditor, EditorContent, FloatingMenu, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { uploadAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

const lowlight = createLowlight(common);

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 underline hover:text-primary-700 cursor-pointer',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: placeholder || "Type '/' for commands...",
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-6',
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border-2 border-gray-300 px-4 py-3 min-w-[100px]',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border-2 border-gray-400 px-4 py-3 bg-gray-100 font-bold text-left min-w-[100px]',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto my-4',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());

      // Check for slash command
      const { selection } = editor.state;
      const { $from } = selection;
      const text = $from.nodeBefore?.text || '';

      if (text.endsWith('/')) {
        const coords = editor.view.coordsAtPos(selection.from);
        setSlashMenuPosition({ top: coords.bottom, left: coords.left });
        setShowSlashMenu(true);
      } else {
        setShowSlashMenu(false);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none px-12 py-8 min-h-[600px]',
      },
    },
  });

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const response = await uploadAPI.uploadImage(file);
        const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}${response.data.url}`;
        editor?.chain().focus().setImage({ src: imageUrl }).run();
        toast.success('Image uploaded successfully');
      } catch (error) {
        toast.error('Failed to upload image');
      }
    };
    input.click();
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  const removeLink = () => {
    editor?.chain().focus().unsetLink().run();
  };

  const executeSlashCommand = (command: string) => {
    if (!editor) return;

    // Delete the slash character
    editor.chain().focus().deleteRange({
      from: editor.state.selection.from - 1,
      to: editor.state.selection.from,
    }).run();

    switch (command) {
      case 'heading1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'heading2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'heading3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'paragraph':
        editor.chain().focus().setParagraph().run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'code':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'quote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'image':
        handleImageUpload();
        break;
      case 'table':
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case 'hr':
        editor.chain().focus().setHorizontalRule().run();
        break;
    }

    setShowSlashMenu(false);
  };

  if (!editor) {
    return null;
  }

  const isTableActive = editor.isActive('table');

  return (
    <div className="relative">
      {/* Paper-like Editor Container */}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
        {/* Toolbar */}
        <div className="editor-toolbar">
          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'is-active' : ''}
              title="Bold (Ctrl+B)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 5H7v2h4c.55 0 1-.45 1-1s-.45-1-1-1zm-3 4h3c.55 0 1 .45 1 1s-.45 1-1 1H8V9zm8-4v10c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2zm-2 0H5v10h10V5zm-3 6h-3v2h3c.55 0 1-.45 1-1s-.45-1-1-1z"/>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'is-active' : ''}
              title="Italic (Ctrl+I)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 5v2h1.21l-1.42 8H8v2h6v-2h-1.21l1.42-8H16V5h-6z"/>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive('underline') ? 'is-active' : ''}
              title="Underline (Ctrl+U)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 16c-2.21 0-4-1.79-4-4V4h2v8c0 1.1.9 2 2 2s2-.9 2-2V4h2v8c0 2.21-1.79 4-4 4zm-6 2v2h12v-2H4z"/>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive('strike') ? 'is-active' : ''}
              title="Strikethrough"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 5c1.66 0 3 1.34 3 3v1h2V8c0-2.76-2.24-5-5-5S5 5.24 5 8h2c0-1.66 1.34-3 3-3zm-6 6v2h12v-2H4zm6 7c-1.66 0-3-1.34-3-3h-2c0 2.76 2.24 5 5 5s5-2.24 5-5h-2c0 1.66-1.34 3-3 3z"/>
              </svg>
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Headings */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
              title="Heading 1"
            >
              <span className="text-sm font-bold">H1</span>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
              title="Heading 2"
            >
              <span className="text-sm font-bold">H2</span>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
              title="Heading 3"
            >
              <span className="text-sm font-bold">H3</span>
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Lists */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'is-active' : ''}
              title="Bullet List"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4h2v2H4V4zm4 0h8v2H8V4zM4 8h2v2H4V8zm4 0h8v2H8V8zm-4 4h2v2H4v-2zm4 0h8v2H8v-2z"/>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'is-active' : ''}
              title="Numbered List"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4h1v3H5v1h2V4h1v4H4V7h1V4zm8 0h4v2h-4V4zm0 4h4v2h-4V8zm0 4h4v2h-4v-2zM4 11h2v3H4v1h4v-1h-1v-2h1v-1H4v1zm0 4h2v1H4v-1zm0-1h2v-1H4v1z"/>
              </svg>
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Blocks */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive('blockquote') ? 'is-active' : ''}
              title="Quote"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 7H3v6h3V7zm8 0h-3v6h3V7z"/>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive('codeBlock') ? 'is-active' : ''}
              title="Code Block"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M12.7 6.3l-1.4-1.4L6 10.2l5.3 5.3 1.4-1.4L8.8 10.2l3.9-3.9z"/>
                <path d="M7.3 6.3l1.4-1.4L14 10.2l-5.3 5.3-1.4-1.4 3.9-3.9-3.9-3.9z"/>
              </svg>
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Media & Links */}
          <div className="flex items-center gap-1">
            <button onClick={handleImageUpload} title="Insert Image">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3h12c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1zm1 2v10h10V5H5zm2 8l2-3 2 3 3-4 2 3V7H7v6z"/>
              </svg>
            </button>
            <button
              onClick={addLink}
              className={editor.isActive('link') ? 'is-active' : ''}
              title="Insert Link"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.26 13a2 2 0 0 1 .01-2.01A3 3 0 0 0 9 5H5a3 3 0 0 0 0 6h.08a6.06 6.06 0 0 0 0 2H5A5 5 0 0 1 5 3h4a5 5 0 0 1 .26 10zm1.48-6a2 2 0 0 1-.01 2.01A3 3 0 0 0 11 15h4a3 3 0 0 0 0-6h-.08a6.06 6.06 0 0 0 0-2H15a5 5 0 0 1 0 10h-4a5 5 0 0 1-.26-10z"/>
              </svg>
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Table */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              title="Insert Table"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3h14v14H3V3zm2 2v3h3V5H5zm5 0v3h5V5h-5zm5 5h-5v5h5v-5zm-7 5v-5H5v5h3z"/>
              </svg>
            </button>
          </div>

          {/* Table Controls - Show when table is active */}
          {isTableActive && (
            <>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                  title="Add Column Before"
                  className="text-xs"
                >
                  ← Col
                </button>
                <button
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  title="Add Column After"
                  className="text-xs"
                >
                  Col →
                </button>
                <button
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  title="Delete Column"
                  className="text-xs text-red-600"
                >
                  Del Col
                </button>
                <button
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  title="Add Row Before"
                  className="text-xs"
                >
                  ↑ Row
                </button>
                <button
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  title="Add Row After"
                  className="text-xs"
                >
                  Row ↓
                </button>
                <button
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  title="Delete Row"
                  className="text-xs text-red-600"
                >
                  Del Row
                </button>
                <button
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  title="Delete Table"
                  className="text-xs text-red-600 font-medium"
                >
                  Del Table
                </button>
              </div>
            </>
          )}

          <div className="w-px h-6 bg-gray-300" />

          {/* Alignment */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
              title="Align Left"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4h14v2H3V4zm0 4h10v2H3V8zm0 4h14v2H3v-2zm0 4h10v2H3v-2z"/>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
              title="Align Center"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4h14v2H3V4zm3 4h8v2H6V8zm-3 4h14v2H3v-2zm3 4h8v2H6v-2z"/>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
              title="Align Right"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4h14v2H3V4zm4 4h10v2H7V8zm-4 4h14v2H3v-2zm4 4h10v2H7v-2z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Editor Content - Paper-like styling */}
        <div className="bg-gray-50 p-8">
          <div className="bg-white shadow-md rounded-sm max-w-4xl mx-auto">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Slash Command Menu */}
        {showSlashMenu && (
          <div
            className="slash-menu"
            style={{
              position: 'fixed',
              top: `${slashMenuPosition.top + 5}px`,
              left: `${slashMenuPosition.left}px`,
            }}
          >
            <div className="bg-white shadow-xl rounded-lg border border-gray-200 p-2 w-64 max-h-96 overflow-y-auto">
              <div className="text-xs text-gray-500 px-2 py-1 font-medium">BASIC BLOCKS</div>
              <button
                onClick={() => executeSlashCommand('paragraph')}
                className="slash-menu-item"
              >
                <span className="text-lg">📝</span>
                <div>
                  <div className="font-medium">Text</div>
                  <div className="text-xs text-gray-500">Just start writing plain text</div>
                </div>
              </button>
              <button
                onClick={() => executeSlashCommand('heading1')}
                className="slash-menu-item"
              >
                <span className="text-lg font-bold">H1</span>
                <div>
                  <div className="font-medium">Heading 1</div>
                  <div className="text-xs text-gray-500">Big section heading</div>
                </div>
              </button>
              <button
                onClick={() => executeSlashCommand('heading2')}
                className="slash-menu-item"
              >
                <span className="text-lg font-bold">H2</span>
                <div>
                  <div className="font-medium">Heading 2</div>
                  <div className="text-xs text-gray-500">Medium section heading</div>
                </div>
              </button>
              <button
                onClick={() => executeSlashCommand('heading3')}
                className="slash-menu-item"
              >
                <span className="text-lg font-bold">H3</span>
                <div>
                  <div className="font-medium">Heading 3</div>
                  <div className="text-xs text-gray-500">Small section heading</div>
                </div>
              </button>

              <div className="text-xs text-gray-500 px-2 py-1 font-medium mt-2">LISTS</div>
              <button
                onClick={() => executeSlashCommand('bulletList')}
                className="slash-menu-item"
              >
                <span className="text-lg">•</span>
                <div>
                  <div className="font-medium">Bullet List</div>
                  <div className="text-xs text-gray-500">Create a simple bullet list</div>
                </div>
              </button>
              <button
                onClick={() => executeSlashCommand('orderedList')}
                className="slash-menu-item"
              >
                <span className="text-lg">1.</span>
                <div>
                  <div className="font-medium">Numbered List</div>
                  <div className="text-xs text-gray-500">Create a numbered list</div>
                </div>
              </button>

              <div className="text-xs text-gray-500 px-2 py-1 font-medium mt-2">MEDIA</div>
              <button
                onClick={() => executeSlashCommand('image')}
                className="slash-menu-item"
              >
                <span className="text-lg">🖼️</span>
                <div>
                  <div className="font-medium">Image</div>
                  <div className="text-xs text-gray-500">Upload an image</div>
                </div>
              </button>

              <div className="text-xs text-gray-500 px-2 py-1 font-medium mt-2">ADVANCED</div>
              <button
                onClick={() => executeSlashCommand('code')}
                className="slash-menu-item"
              >
                <span className="text-lg">{'<>'}</span>
                <div>
                  <div className="font-medium">Code Block</div>
                  <div className="text-xs text-gray-500">Code block with syntax highlighting</div>
                </div>
              </button>
              <button
                onClick={() => executeSlashCommand('quote')}
                className="slash-menu-item"
              >
                <span className="text-lg">&ldquo;</span>
                <div>
                  <div className="font-medium">Quote</div>
                  <div className="text-xs text-gray-500">Capture a quote</div>
                </div>
              </button>
              <button
                onClick={() => executeSlashCommand('table')}
                className="slash-menu-item"
              >
                <span className="text-lg">⊞</span>
                <div>
                  <div className="font-medium">Table</div>
                  <div className="text-xs text-gray-500">Insert a table</div>
                </div>
              </button>
              <button
                onClick={() => executeSlashCommand('hr')}
                className="slash-menu-item"
              >
                <span className="text-lg">―</span>
                <div>
                  <div className="font-medium">Divider</div>
                  <div className="text-xs text-gray-500">Visually divide blocks</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Bubble Menu - appears when text is selected */}
        <BubbleMenu editor={editor} className="bubble-menu">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'is-active' : ''}
            title="Underline"
          >
            <u>U</u>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'is-active' : ''}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive('code') ? 'is-active' : ''}
            title="Inline Code"
          >
            {'</>'}
          </button>
          {editor.isActive('link') ? (
            <button onClick={removeLink} title="Remove Link" className="text-red-600">
              🔗✕
            </button>
          ) : (
            <button onClick={addLink} title="Add Link">
              🔗
            </button>
          )}
        </BubbleMenu>
      </div>
    </div>
  );
}
