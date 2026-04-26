import { Router } from "express";

import { pickRestaurant } from "../controllers/restaurantController";

const restaurantRouter = Router();

restaurantRouter.post("/pick", pickRestaurant);

export { restaurantRouter };
