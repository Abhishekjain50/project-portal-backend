import { Injectable, Logger } from "@nestjs/common";
import * as messages from "./messages.json";

@Injectable()
export class ResponseService {
  private readonly logger = new Logger(ResponseService.name);

  async error(req: any, res: any, msg: any, statusCode = 500, language = "en") {
    if (typeof msg === "string") {
      // console.log(msg.includes(" "))
      if (msg.includes(" ") == false)
        msg = await this.getMessage(msg, language);
    }
    const response = {
      code: 0,
      status: "FAIL",
      message: msg,
    };

    const d = new Date();
    const formatted_date = `${d.getFullYear()}-${d.getMonth() + 1
      }-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
    msg = typeof msg == "object" ? JSON.stringify(msg) : msg;
    this.logger.error(
      `[${formatted_date}] ${req.method}:${req.originalUrl} ${msg}`
    );

    res.status(statusCode).json(response);
  }

  async success(
    res: any,
    msg: any,
    data: any,
    statusCode = 200,
    language = "en",
    total = null
  ) {
    try {
      if (typeof msg === "string") {
        msg = await this.getMessage(msg, language);
      }
      const response = {
        code: 1,
        status: "SUCCESS",
        message: msg,
        data: data /* ? data : {} */,
      };

      if (total) {
        response['total'] = total
      }
      res.status(statusCode).json(response);
    } catch (error) {
      console.error(`\nsuccess error ->> `, error);
      return;
    }
  }

  getMessage(msg: string, language: string) {
    const lang = language ? language : "en";
    return messages[lang][msg] || messages[lang]["SOMETHING_WENT_WRONG"];
  }

  async bbpsError(req: any, res: any, msg: any, statusCode = 500, language = "en") {
    if (typeof msg === "string") {
      // console.log(msg.includes(" "))
      if (msg.includes(" ") == false)
        msg = await this.getMessage(msg, language);
    }

    // const response =  {
    //   reason:msg,
    //   code:statusCode,
    //   status:"FAIL"
    // };
    // const response = { refId: req.body?.refId, errorCode: statusCode, errorDescription: msg,billNumber: req.body?.billerId, customerName: "", amount: "", billPeriod: "", billDate: "", dueDate: "", billerResponseTags:[],additionalInfo:[],tenantId: req.body?.tenantId };

    const response = {"status":"Fail","code":statusCode,"reason":msg}

    const d = new Date();
    const formatted_date = `${d.getFullYear()}-${d.getMonth() + 1
      }-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
    msg = typeof msg == "object" ? JSON.stringify(msg) : msg;
    this.logger.error(
      `[${formatted_date}] ${req.method}:${req.originalUrl} ${msg}`
    );

    res.setHeader('x-digiledge-key', 'jhPOC5KBKD18kdS2EqpeDaSpfB3l1i23');
    res.setHeader('billerId', 'LIFE00000NAT2F');
    res.status(statusCode).json(response);
  }

  async bbpsSuccess(
    res: any,
    msg: any,
    data: any,
    statusCode = 200,
    language = "en",
    total = null
  ) {
    try {
      if (typeof msg === "string") {
        msg = await this.getMessage(msg, language);
      }

      // const response =  {
      //   reason:msg,
      //   code:statusCode,
      //   status:"SUCCESS",
      //   data: data || {}
      // };

      // const response = { refId: data?.refId, errorCode: "", errorDescription: "",billNumber: data?.billNumber, customerName: data?.customerName, amount: data?.amount, billPeriod: "", billDate: data?.billDate, dueDate: data?.dueDate, billerResponseTags:[],additionalInfo:[],tenantId: data?.tenantId };

      // if (total) {
      //   response['total'] = total
      // }

      const response = {"status":"Successful","code":200,"reason":""}

      res.setHeader('x-digiledge-key', 'jhPOC5KBKD18kdS2EqpeDaSpfB3l1i23');
      res.setHeader('billerId', 'LIFE00000NAT2F');
      res.status(statusCode).json(response);
    } catch (error) {
      console.error(`\nsuccess error ->> `, error);
      return;
    }
  }
}
