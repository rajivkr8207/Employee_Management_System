import { afterEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

vi.mock("../../lib/api", () => ({
    api: {
        patch: vi.fn(),
        post: vi.fn(),
    },
}));

import { api } from "../../lib/api";
import { registerThunk, updateProfileThunk } from "./auth.thunk";

afterEach(() => {
    vi.clearAllMocks();
});

const createStore = () => configureStore({ reducer: (state = {}) => state });

describe("auth image upload requests", () => {
    it("sends profile photos as multipart form data", async () => {
        const photo = new File(["photo"], "profile.png", { type: "image/png" });
        api.patch.mockResolvedValue({ data: { data: { avatar: "https://images.test/profile.png" } } });

        await createStore().dispatch(updateProfileThunk({ avatar: photo }));

        const [url, body, config] = api.patch.mock.calls[0];
        expect(url).toBe("/auth/profile");
        expect(body).toBeInstanceOf(FormData);
        expect(body.get("image")).toBe(photo);
        expect(config.headers["Content-Type"]).toBe("multipart/form-data");
    });

    it("sends registration photos as multipart form data", async () => {
        const photo = new File(["photo"], "profile.png", { type: "image/png" });
        api.post.mockResolvedValue({ data: { data: { user: { avatar: "https://images.test/profile.png" } } } });

        await createStore().dispatch(registerThunk({ token: "invite-token", avatar: photo }));

        const [url, body, config] = api.post.mock.calls[0];
        expect(url).toBe("/auth/store-admin/register");
        expect(body).toBeInstanceOf(FormData);
        expect(body.get("image")).toBe(photo);
        expect(config.headers["Content-Type"]).toBe("multipart/form-data");
    });
});
