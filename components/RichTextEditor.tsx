import React from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, ListBulletIcon, ListOrderedIcon } from './icons/Icons';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    const editorRef = React.useRef<HTMLDivElement>(null);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerHTML);
    };
    
    // Use onMouseDown to prevent the editor from losing focus when a button is clicked
    const handleFormat = (e: React.MouseEvent<HTMLButtonElement>, command: string) => {
        e.preventDefault();
        document.execCommand(command, false);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            editorRef.current.focus();
        }
    };
    
    const ToolbarButton: React.FC<{
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
        children: React.ReactNode;
        title: string;
    }> = ({ onClick, children, title }) => (
        <button
            type="button"
            onMouseDown={onClick}
            title={title}
            className="p-2 rounded text-gray-600 hover:bg-gray-200 hover:text-dark focus:outline-none focus:ring-2 focus:ring-primary"
        >
            {children}
        </button>
    );

    return (
        <div className="border border-gray-300 rounded-md shadow-sm">
            <div className="flex items-center gap-1 p-2 border-b bg-gray-50 rounded-t-md">
                <ToolbarButton onClick={(e) => handleFormat(e, 'bold')} title="Bold">
                    <BoldIcon />
                </ToolbarButton>
                <ToolbarButton onClick={(e) => handleFormat(e, 'italic')} title="Italic">
                    <ItalicIcon />
                </ToolbarButton>
                <ToolbarButton onClick={(e) => handleFormat(e, 'underline')} title="Underline">
                    <UnderlineIcon />
                </ToolbarButton>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <ToolbarButton onClick={(e) => handleFormat(e, 'insertUnorderedList')} title="Bullet List">
                    <ListBulletIcon />
                </ToolbarButton>
                <ToolbarButton onClick={(e) => handleFormat(e, 'insertOrderedList')} title="Numbered List">
                    <ListOrderedIcon />
                </ToolbarButton>
            </div>
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                dangerouslySetInnerHTML={{ __html: value }}
                className="prose min-h-[200px] w-full max-w-none p-3 focus:outline-none"
            />
        </div>
    );
};

export default RichTextEditor;