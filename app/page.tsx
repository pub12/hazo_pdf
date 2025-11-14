import { TestAppLayout } from "./test-app-layout";

export default function Home() {
  return (
    <TestAppLayout>
      <div className="cls_test_app_main_content">
        <h2 className="text-2xl font-bold mb-4">Welcome to the Test App</h2>
        <p className="text-muted-foreground">
          This is a test application with a shadcn sidebar. Use the sidebar to navigate between pages.
        </p>
      </div>
    </TestAppLayout>
  );
}

