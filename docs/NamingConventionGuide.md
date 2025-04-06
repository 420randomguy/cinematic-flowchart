# Cinematic Flowchart Naming Conventions

## Components Structure

### Node Components
- **BaseNode**: The foundation component for all nodes (`components/nodes/BaseNode.tsx`)
- **Input Nodes**:
  - `TextNode`: For text input (`components/nodes/TextNode.tsx`)
  - `ImageNode`: For image input (`components/nodes/ImageNode.tsx`) 
  - `URLNode`: For URL input (`components/nodes/URLNode.tsx`)
- **Processing Nodes**:
  - `TextToImageNode`: Generates images from text (`components/nodes/TextToImageNode.tsx`)
  - `TextToVideoNode`: Generates videos from text (`components/nodes/TextToVideoNode.tsx`)
  - `ImageToImageNode`: Transforms images (`components/nodes/ImageToImageNode.tsx`)
  - `ImageToVideoNode`: Transforms images to videos (`components/nodes/ImageToVideoNode.tsx`)

### Container Components
- **FlowchartCanvas**: Main canvas that contains all nodes (`components/core/FlowchartCanvas.tsx`)
- **BaseNodeContainer**: Base container for node layout (`components/core/BaseNodeContainer.tsx`)

### UI Components
- **UI elements**: Stored in `components/ui/`
- **Shared components**: Reusable components in `components/shared/`
- **Sections**: Structural sections in `components/sections/`
- **Controls**: UI controls in `components/controls/`
- **Modals**: Modal dialogs in `components/modals/`
- **Canvas components**: Canvas-specific UI in `components/canvas/`

## State Management
- **Zustand Stores**: All state stores use the format `use[Name]Store.ts` in the `store/` directory
- **React Hooks**: Custom hooks use the format `use[Name].ts` in the `hooks/` directory

## Files/Directories Naming
- **Component files**: Use PascalCase for React components (e.g., `ImageNode.tsx`)
- **Utility files**: Use kebab-case for utility files (e.g., `code-splitting.tsx`)
- **Type files**: Use kebab-case for type definitions (e.g., `node-model.ts`)
- **Directories**: Use kebab-case for directories (e.g., `components/ui/`)

## Props Naming
- **Event handlers**: Begin with `on` for callbacks passed to components (e.g., `onSelect`)
- **Handler functions**: Begin with `handle` for functions defined within components (e.g., `handleClick`)
- **Boolean states**: Begin with `is` or `has` (e.g., `isSelected`, `hasConnections`)
- **Modal states**: Use `show` prefix for visibility toggles (e.g., `showImageSelector`)

## Data Flow
- **Node data**: Passed through the `data` prop to node components
- **Node connections**: Managed through connection stores and hooks
- **Node rendering**: Dynamically loaded through the `dynamic-node-types.ts` utility

## Best Practices
- Keep node components focused on rendering and basic interaction
- Use hooks for complex logic and state management
- Maintain separation between UI, state management, and business logic
- Follow ReactFlow conventions for node and edge handling 