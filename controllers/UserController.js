import UserService from "../services/UserService.js";

class UserController {
  async register(req, res) {
    try {
      const result = await UserService.asyncRegister(req.body);
      res.json(result);
    } catch (e) {
      res.status(500).json(e);
    }
  }

  async login(req, res) {
    try {
      const result = await UserService.asyncLogin(
        req.body.username,
        req.body.password,
      );
      return res.json(result);
    } catch (e) {
      res.status(500).json(e);
    }
  }
  async delete(req, res) {
    try {
      return res.json("пока нихуя не работает");
    } catch (e) {
      res.status(500).json(e);
    }
  }
}

export default new UserController();
