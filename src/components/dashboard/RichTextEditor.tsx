"use client";

import { useEffect, useState, forwardRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor = forwardRef<ReactQuill, RichTextEditorProps>(
  ({ value, onChange, placeholder = "Write your blog content here...", className }, ref) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    // Custom toolbar configuration
    const modules = {
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ script: "sub" }, { script: "super" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ direction: "rtl" }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ["link", "image", "video"],
        ["clean"],
      ],
    };

    const formats = [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "blockquote",
      "list",
      "bullet",
      "indent",
      "link",
      "image",
      "video",
      "color",
      "background",
      "align",
      "code-block",
      "script",
      "direction",
    ];

    // Custom styles to match the design system
    useEffect(() => {
      if (isClient) {
        // Inject custom styles for ReactQuill
        const style = document.createElement("style");
        style.textContent = `
          .ql-editor {
            min-height: 300px;
            font-family: inherit;
            font-size: 16px;
            line-height: 1.6;
            color: rgb(55, 65, 81);
          }
          
          .ql-editor.ql-blank::before {
            color: rgb(156, 163, 175);
            font-style: normal;
          }
          
          .ql-toolbar {
            border-top: 1px solid rgb(209, 213, 219);
            border-left: 1px solid rgb(209, 213, 219);
            border-right: 1px solid rgb(209, 213, 219);
            border-bottom: none;
            border-radius: 8px 8px 0 0;
            background: rgb(249, 250, 251);
          }
          
          .ql-container {
            border-top: 1px solid rgb(209, 213, 219);
            border-left: 1px solid rgb(209, 213, 219);
            border-right: 1px solid rgb(209, 213, 219);
            border-bottom: 1px solid rgb(209, 213, 219);
            border-radius: 0 0 8px 8px;
            font-size: 16px;
          }
          
          .ql-toolbar button {
            border-radius: 4px;
            margin: 1px;
          }
          
          .ql-toolbar button:hover {
            background-color: rgb(239, 246, 255);
            color: rgb(37, 99, 235);
          }
          
          .ql-toolbar button.ql-active {
            background-color: rgb(239, 246, 255);
            color: rgb(37, 99, 235);
          }
          
          .ql-toolbar .ql-stroke {
            stroke: rgb(107, 114, 128);
          }
          
          .ql-toolbar .ql-fill {
            fill: rgb(107, 114, 128);
          }
          
          .ql-toolbar button:hover .ql-stroke,
          .ql-toolbar button.ql-active .ql-stroke {
            stroke: rgb(37, 99, 235);
          }
          
          .ql-toolbar button:hover .ql-fill,
          .ql-toolbar button.ql-active .ql-fill {
            fill: rgb(37, 99, 235);
          }
          
          .ql-editor h1 {
            font-size: 2em;
            font-weight: bold;
            margin: 0.67em 0;
          }
          
          .ql-editor h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 0.75em 0;
          }
          
          .ql-editor h3 {
            font-size: 1.17em;
            font-weight: bold;
            margin: 0.83em 0;
          }
          
          .ql-editor blockquote {
            border-left: 4px solid rgb(209, 213, 219);
            margin: 1em 0;
            padding-left: 1em;
            color: rgb(107, 114, 128);
            font-style: italic;
          }
          
          .ql-editor code {
            background-color: rgb(243, 244, 246);
            padding: 2px 4px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
          }
          
          .ql-editor pre {
            background-color: rgb(243, 244, 246);
            padding: 1em;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
          }
          
          .ql-editor a {
            color: rgb(37, 99, 235);
            text-decoration: underline;
          }
          
          .ql-editor a:hover {
            color: rgb(29, 78, 216);
          }
        `;
        document.head.appendChild(style);

        return () => {
          document.head.removeChild(style);
        };
      }
    }, [isClient]);

    if (!isClient) {
      return (
        <div className="border border-neutral-300 rounded-lg">
          <div className="h-12 bg-neutral-100 rounded-t-lg animate-pulse"></div>
          <div className="h-64 bg-white rounded-b-lg animate-pulse"></div>
        </div>
      );
    }

    return (
      <div className={className}>
        <ReactQuill
          ref={ref}
          theme="snow"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          modules={modules}
          formats={formats}
        />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
