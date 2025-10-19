import React, { useEffect, useRef } from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, ListBulletIcon, ListOrderedIcon, ImageIcon } from './icons/Icons';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerHTML);
    };
    
    const handleFormat = (e: React.MouseEvent<HTMLButtonElement>, command: string) => {
        e.preventDefault();
        document.execCommand(command, false);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            editorRef.current.focus();
        }
    };

    const handleImageButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        fileInputRef.current?.click();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                const base64Image = readerEvent.target?.result;
                if (base64Image && editorRef.current) {
                    editorRef.current.focus();
                    const imgHtml = `<img src="${base64Image}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;" />`;
                    document.execCommand('insertHTML', false, imgHtml);
                    onChange(editorRef.current.innerHTML);
                }
            };
            reader.readAsDataURL(file);
        }
        if (e.target) {
            e.target.value = '';
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
            <div className="flex items-center flex-wrap gap-1 p-2 border-b bg-gray-50 rounded-t-md">
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
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <ToolbarButton onClick={handleImageButtonClick} title="Sisipkan Gambar">
                    <ImageIcon />
                </ToolbarButton>
            </div>
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="prose min-h-[200px] w-full max-w-none p-3 focus:outline-none"
            />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/png, image/jpeg, image/gif"
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default RichTextEditor;