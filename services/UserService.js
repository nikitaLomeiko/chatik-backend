import User from "../entities/User.js";
import bcrypt from "bcrypt";
import { generateToken } from "../config/jwt.js";

const SALT_ROUNDS = 10;

class UserService {
  async asyncRegister(userData) {
    try {
      const existingUser = await User.findOne({ name: userData.username });

      if (existingUser) {
        return {
          success: false,
          message: "Пользователь с таким именем уже существует",
        };
      }

      const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

      const newUser = await User.create({
        username: userData.username,
        password: hashedPassword,
      });

      const token = generateToken(newUser._id, newUser.username);

      const userResponse = newUser.toJSON();

      return {
        success: true,
        data: {
          user: userResponse,
          token,
        },
        message: "Пользователь успешно зарегистрирован",
      };
    } catch (err) {
      console.error("Ошибка регистрации:", err);
      return {
        success: false,
        message: "Ошибка при регистрации",
        error: err.message,
      };
    }
  }

  async asyncLogin(username, password) {
    try {
      const user = await User.findOne({ username });

      if (!user) {
        return {
          success: false,
          message: "Пользователь не найден",
        };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return {
          success: false,
          message: "Неверный пароль",
        };
      }

      const token = generateToken(user._id, user.username);

      const userResponse = user.toJSON();

      return {
        success: true,
        data: {
          user: userResponse,
          token,
        },
        message: "Успешный вход",
      };
    } catch (err) {
      console.error("Ошибка входа:", err);
      return {
        success: false,
        message: "Ошибка при входе",
        error: err.message,
      };
    }
  }

  async asyncGetUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: "Пользователь не найден",
        };
      }

      return {
        success: true,
        data: user.toJSON(),
      };
    } catch (err) {
      return {
        success: false,
        message: "Ошибка получения пользователя",
      };
    }
  }

  async asyncDelete(id) {
    try {
      const deleted = await User.findByIdAndDelete(id);

      if (!deleted) {
        return {
          success: false,
          message: "Пользователь не найден",
        };
      }

      return {
        success: true,
        message: "Пользователь удален",
      };
    } catch (err) {
      return {
        success: false,
        message: "Ошибка удаления",
      };
    }
  }
}

export default new UserService();
