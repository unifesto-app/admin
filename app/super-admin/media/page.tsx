export default function MediaLibraryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Media Library</h1>
          <p className="text-sm text-zinc-400 mt-0.5">All uploaded images, documents, and assets across the platform.</p>
        </div>
        <button className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-zinc-800 transition-colors">
          Upload File
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search files..."
          className="border border-zinc-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:border-black"
        />
        <select className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-600 focus:outline-none focus:border-black">
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="document">Documents</option>
          <option value="video">Videos</option>
          <option value="other">Other</option>
        </select>
        <select className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-600 focus:outline-none focus:border-black">
          <option value="grid">Grid View</option>
          <option value="list">List View</option>
        </select>
      </div>

      {/* Upload drop zone */}
      <div className="border-2 border-dashed border-zinc-200 rounded-xl p-10 text-center hover:border-zinc-400 transition-colors cursor-pointer bg-white">
        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-lg mx-auto mb-3">▣</div>
        <p className="text-sm font-medium text-zinc-600">Drag and drop files here</p>
        <p className="text-xs text-zinc-400 mt-1">or click to browse — PNG, JPG, PDF, MP4 up to 50MB</p>
      </div>

      {/* Empty grid */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <p className="text-sm font-medium text-zinc-500">No files uploaded yet</p>
          <p className="text-xs text-zinc-400">Uploaded media will appear here in a grid or list view.</p>
        </div>
      </div>
    </div>
  );
}
