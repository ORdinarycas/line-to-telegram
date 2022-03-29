import {UserController} from "./controller/UserController";
import {LineController} from "./controller/LineController";
import {TelegramController} from "./controller/TelegramController";

export const Routes = [{
    method: "get",
    route: "/users",
    controller: UserController,
    action: "all"
}, {
    method: "get",
    route: "/users/:id",
    controller: UserController,
    action: "one"
}, {
    method: "post",
    route: "/users",
    controller: UserController,
    action: "save"
}, {
    method: "delete",
    route: "/users/:id",
    controller: UserController,
    action: "remove"
}, {
    method: "post",
    route: "/webhook",
    controller: LineController,
    action: "webhook"
} ,{
    method: "post",
    route: "/tg/webhook",
    controller: TelegramController,
    action: "webhook"
}];