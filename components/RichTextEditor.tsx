import React, { useEffect, useRef, useState } from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, ListBulletIcon, ListOrderedIcon, ImageIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from './icons/Icons';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);
    
    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const node = range.startContainer.childNodes[range.startOffset] as HTMLElement;
                if (node && node.tagName === 'IMG') {
                    setSelectedImage(node as HTMLImageElement);
                } else if (selection.anchorNode && selection.anchorNode.nodeName === 'IMG') {
                     setSelectedImage(selection.anchorNode as HTMLImageElement);
                } else {
                    setSelectedImage(null);
                }
            } else {
                setSelectedImage(null);
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);


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
                    const imgHtml = `<img src="${base64Image}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block;" />`;
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
    
    const handleImageStyle = (style: Partial<CSSStyleDeclaration>) => {
        if (!selectedImage) return;

        // Reset previous alignment styles before applying new ones
        if (style.float !== undefined || style.display === 'block') {
             selectedImage.style.float = 'none';
             selectedImage.style.display = 'block';
             selectedImage.style.margin = '8px auto';
        }

        if (style.float === 'left') {
            selectedImage.style.float = 'left';
            selectedImage.style.margin = '0 1em 1em 0';
        } else if (style.float === 'right') {
            selectedImage.style.float = 'right';
            selectedImage.style.margin = '0 0 1em 1em';
        }
        
        if (style.width) {
            selectedImage.style.width = style.width;
        }
        
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    
    const ToolbarButton: React.FC<{
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
        children: React.ReactNode;
        title: string;
    }> = ({ onClick, children, title }) => (
        <button
            type="button"
            onMouseDown={onClick} // use onMouseDown to prevent losing focus on editor
            title={title}
            className="p-2 rounded text-gray-300 hover:bg-gray-600 hover:text-dark focus:outline-none focus:ring-2 focus:ring-primary"
        >
            {children}
        </button>
    );

    return (
        <div className="border border-gray-600 rounded-md">
            <div className="flex items-center flex-wrap gap-1 p-2 border-b border-gray-600 bg-gray-700 rounded-t-md">
                <ToolbarButton onClick={(e) => handleFormat(e, 'bold')} title="Bold">
                    <BoldIcon />
                </ToolbarButton>
                <ToolbarButton onClick={(e) => handleFormat(e, 'italic')} title="Italic">
                    <ItalicIcon />
                </ToolbarButton>
                <ToolbarButton onClick={(e) => handleFormat(e, 'underline')} title="Underline">
                    <UnderlineIcon />
                </ToolbarButton>
                <div className="w-px h-6 bg-gray-500 mx-2"></div>
                <ToolbarButton onClick={(e) => handleFormat(e, 'insertUnorderedList')} title="Bullet List">
                    <ListBulletIcon />
                </ToolbarButton>
                <ToolbarButton onClick={(e) => handleFormat(e, 'insertOrderedList')} title="Numbered List">
                    <ListOrderedIcon />
                </ToolbarButton>
                <div className="w-px h-6 bg-gray-500 mx-2"></div>
                <ToolbarButton onClick={handleImageButtonClick} title="Sisipkan Gambar">
                    <ImageIcon />
                </ToolbarButton>
                
                {selectedImage && (
                    <>
                        <div className="w-px h-6 bg-gray-500 mx-2"></div>
                        <span className="text-xs font-semibold text-gray-400 mr-2">Gambar:</span>
                        <ToolbarButton onClick={() => handleImageStyle({ float: 'left' })} title="Rata Kiri"><AlignLeftIcon /></ToolbarButton>
                        <ToolbarButton onClick={() => handleImageStyle({ display: 'block' })} title="Rata Tengah"><AlignCenterIcon /></ToolbarButton>
                        <ToolbarButton onClick={() => handleImageStyle({ float: 'right' })} title="Rata Kanan"><AlignRightIcon /></ToolbarButton>
                        <div className="w-px h-6 bg-gray-500 mx-2"></div>
                         <button onClick={() => handleImageStyle({ width: '25%' })} className="text-xs px-2 py-1 rounded hover:bg-gray-600 text-gray-300">25%</button>
                         <button onClick={() => handleImageStyle({ width: '50%' })} className="text-xs px-2 py-1 rounded hover:bg-gray-600 text-gray-300">50%</button>
                         <button onClick={() => handleImageStyle({ width: '75%' })} className="text-xs px-2 py-1 rounded hover:bg-gray-600 text-gray-300">75%</button>
                         <button onClick={() => handleImageStyle({ width: '100%' })} className="text-xs px-2 py-1 rounded hover:bg-gray-600 text-gray-300">100%</button>
                    </>
                )}
            </div>
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onClick={() => {
                     const selection = window.getSelection();
                     if (selection?.anchorNode?.nodeName === 'IMG') {
                        setSelectedImage(selection.anchorNode as HTMLImageElement);
                     }
                }}
                className="prose min-h-[200px] w-full max-w-none p-3 focus:outline-none text-dark"
            />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/png, image/jpeg, image/gif"
                style={{ display: 'none' }}
            />
             <style>{`
                .prose p { color: #d1d5db; } /* gray-300 */
                .prose h1, .prose h2, .prose h3, .prose strong { color: #f9fafb; } /* gray-50 */
                .prose a { color: #60a5fa; } /* blue-400 */
                .prose ul, .prose ol { color: #d1d5db; }
            `}</style>
        </div>
    );
};

export default RichTextEditor;