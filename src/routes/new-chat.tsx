import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import NewChatPage from "../pages/new-chat";
import { z } from "zod";

export const newChatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/new-chat",
  component: NewChatPage,
  validateSearch: z.object({
    id: z.number().optional(),
  }),
});