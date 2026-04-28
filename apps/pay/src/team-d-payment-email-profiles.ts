import type { ToneMode } from "./payment-surface-registry.js";

export interface TeamDPaymentEmailLocalizedCopy {
  en: string;
  vi: string;
}

export interface TeamDPaymentEmailProfile {
  allowedLocales: string[];
  brandName: string;
  customerFacingPaymentEmailAllowed: boolean;
  defaultLocale: string;
  domain: string;
  item: {
    label: TeamDPaymentEmailLocalizedCopy;
    valueVariable: string;
  };
  links: {
    failed: {
      label: TeamDPaymentEmailLocalizedCopy;
      valueVariable: string;
    };
    pending: {
      label: TeamDPaymentEmailLocalizedCopy;
      valueVariable: string;
    };
    receipt: {
      label: TeamDPaymentEmailLocalizedCopy;
      valueVariable: string;
    };
    refund: {
      label: TeamDPaymentEmailLocalizedCopy;
      valueVariable: string;
    };
  };
  paymentPack: string;
  reference: {
    label: TeamDPaymentEmailLocalizedCopy;
    valueVariable: string;
  };
  senderPolicy: {
    billingSender: string;
    noreplyAllowedForPaymentMail: boolean;
    paySender: string;
    replyTo: string;
    supportEmail: string;
  };
  surfaceClass: string;
  surfaceRole: string;
  templateScope: "TEAM_D_CORE_PAYMENT_SET";
  toneMode: ToneMode | string;
  triggers: {
    failed: string;
    pending: string;
    receipt: string;
    refund: string;
  };
  copy: {
    failed: {
      intro: TeamDPaymentEmailLocalizedCopy;
      preview: TeamDPaymentEmailLocalizedCopy;
      subject: TeamDPaymentEmailLocalizedCopy;
    };
    pending: {
      intro: TeamDPaymentEmailLocalizedCopy;
      preview: TeamDPaymentEmailLocalizedCopy;
      subject: TeamDPaymentEmailLocalizedCopy;
    };
    receipt: {
      intro: TeamDPaymentEmailLocalizedCopy;
      preview: TeamDPaymentEmailLocalizedCopy;
      subject: TeamDPaymentEmailLocalizedCopy;
    };
    refund: {
      intro: TeamDPaymentEmailLocalizedCopy;
      preview: TeamDPaymentEmailLocalizedCopy;
      subject: TeamDPaymentEmailLocalizedCopy;
    };
  };
}

function createSenderPolicy(domain: string) {
  return {
    billingSender: `billing@${domain}`,
    noreplyAllowedForPaymentMail: false,
    paySender: `pay@${domain}`,
    replyTo: `support@${domain}`,
    supportEmail: `support@${domain}`
  };
}

const orderReference = {
  label: {
    en: "Order ID",
    vi: "Mã đơn hàng"
  },
  valueVariable: "{{order_id}}"
} as const;

const invoiceReference = {
  label: {
    en: "Invoice ID",
    vi: "Mã hóa đơn"
  },
  valueVariable: "{{invoice_id}}"
} as const;

const orderLinks = {
  failed: {
    label: {
      en: "You can reopen or retry the payment here",
      vi: "Bạn có thể mở lại hoặc thử lại thanh toán tại đây"
    },
    valueVariable: "{{checkout_url}}"
  },
  pending: {
    label: {
      en: "You can continue or review the payment status here",
      vi: "Bạn có thể tiếp tục hoặc kiểm tra trạng thái thanh toán tại đây"
    },
    valueVariable: "{{checkout_url}}"
  },
  receipt: {
    label: {
      en: "If a receipt or detail page is available, review it here",
      vi: "Nếu có trang biên nhận hoặc chi tiết, bạn có thể xem tại đây"
    },
    valueVariable: "{{receipt_url}}"
  },
  refund: {
    label: {
      en: "If a billing or refund detail page is available, review it here",
      vi: "Nếu có trang chi tiết billing hoặc hoàn tiền, bạn có thể xem tại đây"
    },
    valueVariable: "{{invoice_url}}"
  }
} as const;

const billingLinks = {
  failed: {
    label: {
      en: "You can review the billing record or retry here",
      vi: "Bạn có thể xem lại bản ghi billing hoặc thử lại tại đây"
    },
    valueVariable: "{{billing_url}}"
  },
  pending: {
    label: {
      en: "You can review the billing record here",
      vi: "Bạn có thể xem lại bản ghi billing tại đây"
    },
    valueVariable: "{{billing_url}}"
  },
  receipt: {
    label: {
      en: "If the invoice or receipt is available, review it here",
      vi: "Nếu hóa đơn hoặc biên nhận đã sẵn sàng, bạn có thể xem tại đây"
    },
    valueVariable: "{{invoice_url}}"
  },
  refund: {
    label: {
      en: "If the invoice or adjustment record is available, review it here",
      vi: "Nếu hóa đơn hoặc bản ghi điều chỉnh đã sẵn sàng, bạn có thể xem tại đây"
    },
    valueVariable: "{{invoice_url}}"
  }
} as const;

export const teamDPaymentEmailProfiles: TeamDPaymentEmailProfile[] = [
  {
    allowedLocales: ["vi", "en"],
    brandName: "Nguyễn Lan Anh",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "nguyenlananh.com",
    item: {
      label: {
        en: "Membership / journey",
        vi: "Gói / hành trình"
      },
      valueVariable: "{{product_name}}"
    },
    links: orderLinks,
    paymentPack: "TEAM_D_CORE_4",
    reference: orderReference,
    senderPolicy: createSenderPolicy("nguyenlananh.com"),
    surfaceClass: "TEAM_D_PREP_SITE",
    surfaceRole: "Membership journey for inner-life rebuilding, practice, and deep content",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "WARM_HUMAN",
    triggers: {
      failed: "thanh toán mở quyền thành viên không hoàn tất hoặc phiên thanh toán hết hạn",
      pending: "checkout mở quyền thành viên đã tạo nhưng còn chờ xác nhận",
      receipt: "thanh toán mở quyền thành viên đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho quyền thành viên / hành trình đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not finish the payment step for your membership journey yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước thanh toán để mở hành trình thành viên cho bạn."
        },
        preview: {
          en: "Your membership access was not activated yet. You can review the payment step below.",
          vi: "Quyền thành viên của bạn chưa được kích hoạt. Bạn có thể xem lại bước thanh toán bên dưới."
        },
        subject: {
          en: "Nguyenlananh.com | Membership access was not completed for #{{order_id}}",
          vi: "Nguyenlananh.com | Chưa thể mở quyền thành viên cho đơn #{{order_id}}"
        }
      },
      pending: {
        intro: {
          en: "We recorded your request to open membership access so you can continue the journey, practice, and deeper reading paths.",
          vi: "Chúng tôi đã ghi nhận yêu cầu mở quyền thành viên để bạn tiếp tục hành trình, thực hành và các chuyên đề đi sâu hơn."
        },
        preview: {
          en: "Your membership checkout is pending confirmation.",
          vi: "Checkout thành viên của bạn đang chờ xác nhận."
        },
        subject: {
          en: "Nguyenlananh.com | Your membership access is pending confirmation",
          vi: "Nguyenlananh.com | Quyền thành viên của bạn đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed your payment and opened membership access for the next part of your journey.",
          vi: "Chúng tôi đã xác nhận thanh toán và mở quyền thành viên cho chặng tiếp theo trong hành trình của bạn."
        },
        preview: {
          en: "Your membership access has been confirmed.",
          vi: "Quyền thành viên của bạn đã được xác nhận."
        },
        subject: {
          en: "Nguyenlananh.com | Membership access receipt #{{order_id}}",
          vi: "Nguyenlananh.com | Biên nhận mở quyền thành viên #{{order_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed an update related to the membership payment for your journey.",
          vi: "Chúng tôi đã xử lý một cập nhật liên quan đến khoản thanh toán thành viên cho hành trình của bạn."
        },
        preview: {
          en: "We processed a refund or adjustment for your membership payment.",
          vi: "Chúng tôi đã xử lý hoàn tiền hoặc điều chỉnh cho khoản thanh toán thành viên của bạn."
        },
        subject: {
          en: "Nguyenlananh.com | Refund / adjustment update for #{{order_id}}",
          vi: "Nguyenlananh.com | Cập nhật hoàn tiền / điều chỉnh cho đơn #{{order_id}}"
        }
      }
    }
  },
  {
    allowedLocales: ["en", "vi", "zh", "es", "ja", "ko"],
    brandName: "OMDALA",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "en",
    domain: "omdala.com",
    item: {
      label: {
        en: "Plan / activation access",
        vi: "Gói / quyền kích hoạt"
      },
      valueVariable: "{{product_name}}"
    },
    links: orderLinks,
    paymentPack: "TEAM_D_CORE_4",
    reference: orderReference,
    senderPolicy: createSenderPolicy("omdala.com"),
    surfaceClass: "TEAM_D_PREP_SITE",
    surfaceRole: "Verified coordination platform for real-world activation and trust",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "STRUCTURED_TRUST_FIRST",
    triggers: {
      failed: "thanh toán cho gói kích hoạt OMDALA không hoàn tất",
      pending: "checkout kích hoạt OMDALA đã tạo nhưng còn chờ provider xác nhận",
      receipt: "thanh toán cho gói kích hoạt OMDALA đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho gói kích hoạt OMDALA đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not complete the payment step for your OMDALA activation yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước thanh toán cho quyền kích hoạt của bạn trên OMDALA."
        },
        preview: {
          en: "Your OMDALA activation is not complete yet.",
          vi: "Quyền kích hoạt OMDALA của bạn chưa hoàn tất."
        },
        subject: {
          en: "OMDALA | Activation payment was not completed for #{{order_id}}",
          vi: "OMDALA | Thanh toán kích hoạt chưa hoàn tất cho đơn #{{order_id}}"
        }
      },
      pending: {
        intro: {
          en: "We recorded your request to activate a coordination plan or access lane on OMDALA, and the provider confirmation is still pending.",
          vi: "Chúng tôi đã ghi nhận yêu cầu kích hoạt một gói điều phối hoặc lane truy cập trên OMDALA, và hiện vẫn đang chờ xác nhận từ provider."
        },
        preview: {
          en: "Your OMDALA activation is pending confirmation.",
          vi: "Yêu cầu kích hoạt OMDALA của bạn đang chờ xác nhận."
        },
        subject: {
          en: "OMDALA | Activation is pending confirmation",
          vi: "OMDALA | Yêu cầu kích hoạt đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed your payment for the OMDALA activation you requested.",
          vi: "Chúng tôi đã xác nhận thanh toán cho quyền kích hoạt bạn yêu cầu trên OMDALA."
        },
        preview: {
          en: "Your OMDALA activation payment has been confirmed.",
          vi: "Thanh toán kích hoạt OMDALA của bạn đã được xác nhận."
        },
        subject: {
          en: "OMDALA | Activation payment receipt #{{order_id}}",
          vi: "OMDALA | Biên nhận thanh toán kích hoạt #{{order_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed a refund or adjustment related to your OMDALA activation payment.",
          vi: "Chúng tôi đã xử lý một hoàn tiền hoặc điều chỉnh liên quan đến khoản thanh toán kích hoạt OMDALA của bạn."
        },
        preview: {
          en: "A refund or adjustment was processed for your OMDALA payment.",
          vi: "Một hoàn tiền hoặc điều chỉnh đã được xử lý cho khoản thanh toán OMDALA của bạn."
        },
        subject: {
          en: "OMDALA | Refund / adjustment update for #{{order_id}}",
          vi: "OMDALA | Cập nhật hoàn tiền / điều chỉnh cho đơn #{{order_id}}"
        }
      }
    }
  },
  {
    allowedLocales: ["en", "vi"],
    brandName: "OMDALA App",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "en",
    domain: "app.omdala.com",
    item: {
      label: {
        en: "Workspace / access lane",
        vi: "Workspace / quyền truy cập"
      },
      valueVariable: "{{workspace_name}}"
    },
    links: billingLinks,
    paymentPack: "TEAM_D_CORE_4",
    reference: invoiceReference,
    senderPolicy: createSenderPolicy("app.omdala.com"),
    surfaceClass: "TEAM_D_PREP_SITE",
    surfaceRole: "Authenticated product shell for OMDALA sessions, dashboards, and requests",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "ACCOUNT_CENTRIC",
    triggers: {
      failed: "billing hoặc mở quyền truy cập app.omdala.com không hoàn tất",
      pending: "billing hoặc mở quyền truy cập app.omdala.com còn chờ xác nhận",
      receipt: "billing hoặc mở quyền truy cập app.omdala.com đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho app.omdala.com đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not complete the billing step for your OMDALA App workspace access yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước billing cho quyền truy cập workspace trên OMDALA App của bạn."
        },
        preview: {
          en: "Your OMDALA App billing action was not completed.",
          vi: "Thao tác billing trên OMDALA App của bạn chưa hoàn tất."
        },
        subject: {
          en: "OMDALA App | Billing action was not completed",
          vi: "OMDALA App | Thao tác billing chưa hoàn tất"
        }
      },
      pending: {
        intro: {
          en: "We recorded a billing action for your OMDALA App workspace, and the confirmation is still pending.",
          vi: "Chúng tôi đã ghi nhận một thao tác billing cho workspace OMDALA App của bạn và hiện vẫn đang chờ xác nhận."
        },
        preview: {
          en: "Your OMDALA App billing action is pending confirmation.",
          vi: "Thao tác billing trên OMDALA App của bạn đang chờ xác nhận."
        },
        subject: {
          en: "OMDALA App | Billing action is pending confirmation",
          vi: "OMDALA App | Thao tác billing đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed the billing action connected to your OMDALA App workspace access.",
          vi: "Chúng tôi đã xác nhận thao tác billing gắn với quyền truy cập workspace OMDALA App của bạn."
        },
        preview: {
          en: "Your OMDALA App billing action has been confirmed.",
          vi: "Thao tác billing trên OMDALA App của bạn đã được xác nhận."
        },
        subject: {
          en: "OMDALA App | Billing receipt #{{invoice_id}}",
          vi: "OMDALA App | Biên nhận billing #{{invoice_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed a refund or adjustment related to your OMDALA App workspace billing.",
          vi: "Chúng tôi đã xử lý một hoàn tiền hoặc điều chỉnh liên quan đến billing workspace OMDALA App của bạn."
        },
        preview: {
          en: "A refund or adjustment was processed for your OMDALA App billing record.",
          vi: "Một hoàn tiền hoặc điều chỉnh đã được xử lý cho bản ghi billing OMDALA App của bạn."
        },
        subject: {
          en: "OMDALA App | Refund / adjustment update #{{invoice_id}}",
          vi: "OMDALA App | Cập nhật hoàn tiền / điều chỉnh #{{invoice_id}}"
        }
      }
    }
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "Ôm Đà Lạt",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "omdalat.com",
    item: {
      label: {
        en: "Membership / access",
        vi: "Gói / quyền tham gia"
      },
      valueVariable: "{{product_name}}"
    },
    links: orderLinks,
    paymentPack: "TEAM_D_CORE_4",
    reference: orderReference,
    senderPolicy: createSenderPolicy("omdalat.com"),
    surfaceClass: "TEAM_D_PREP_SITE",
    surfaceRole: "Real-life Da Lat system for living, working, learning, and community",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "WARM_HUMAN",
    triggers: {
      failed: "thanh toán tham gia Ôm Đà Lạt không hoàn tất",
      pending: "checkout tham gia Ôm Đà Lạt còn chờ xác nhận",
      receipt: "thanh toán tham gia Ôm Đà Lạt đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho tham gia Ôm Đà Lạt đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not complete the payment step for your Om Dalat access yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước thanh toán cho quyền tham gia Ôm Đà Lạt của bạn."
        },
        preview: {
          en: "Your Om Dalat access is not complete yet.",
          vi: "Quyền tham gia Ôm Đà Lạt của bạn chưa hoàn tất."
        },
        subject: {
          en: "Om Dalat | Access payment was not completed for #{{order_id}}",
          vi: "Ôm Đà Lạt | Thanh toán quyền tham gia chưa hoàn tất cho đơn #{{order_id}}"
        }
      },
      pending: {
        intro: {
          en: "We recorded your request to join the Om Dalat system for living, working, learning, and community in Da Lat, and the provider confirmation is still pending.",
          vi: "Chúng tôi đã ghi nhận yêu cầu tham gia hệ Ôm Đà Lạt để sống, làm việc, học và kết nối cộng đồng tại Đà Lạt, và hiện vẫn đang chờ xác nhận từ cổng thanh toán."
        },
        preview: {
          en: "Your Om Dalat checkout is pending confirmation.",
          vi: "Checkout tham gia Ôm Đà Lạt của bạn đang chờ xác nhận."
        },
        subject: {
          en: "Om Dalat | Your access is pending confirmation",
          vi: "Ôm Đà Lạt | Quyền tham gia của bạn đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed your payment for Om Dalat access.",
          vi: "Chúng tôi đã xác nhận thanh toán cho quyền tham gia Ôm Đà Lạt của bạn."
        },
        preview: {
          en: "Your Om Dalat access payment has been confirmed.",
          vi: "Thanh toán quyền tham gia Ôm Đà Lạt của bạn đã được xác nhận."
        },
        subject: {
          en: "Om Dalat | Access payment receipt #{{order_id}}",
          vi: "Ôm Đà Lạt | Biên nhận thanh toán quyền tham gia #{{order_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed a refund or adjustment related to your Om Dalat access payment.",
          vi: "Chúng tôi đã xử lý một hoàn tiền hoặc điều chỉnh liên quan đến khoản thanh toán quyền tham gia Ôm Đà Lạt của bạn."
        },
        preview: {
          en: "A refund or adjustment was processed for your Om Dalat payment.",
          vi: "Một hoàn tiền hoặc điều chỉnh đã được xử lý cho khoản thanh toán Ôm Đà Lạt của bạn."
        },
        subject: {
          en: "Om Dalat | Refund / adjustment update for #{{order_id}}",
          vi: "Ôm Đà Lạt | Cập nhật hoàn tiền / điều chỉnh cho đơn #{{order_id}}"
        }
      }
    }
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "Ôm Đà Lạt App",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "app.omdalat.com",
    item: {
      label: {
        en: "Workspace / member access",
        vi: "Workspace / quyền thành viên"
      },
      valueVariable: "{{workspace_name}}"
    },
    links: billingLinks,
    paymentPack: "TEAM_D_CORE_4",
    reference: invoiceReference,
    senderPolicy: createSenderPolicy("app.omdalat.com"),
    surfaceClass: "TEAM_D_PREP_SITE",
    surfaceRole: "Member and operations workspace for Om Dalat",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "ACCOUNT_CENTRIC",
    triggers: {
      failed: "thanh toán hoặc mở quyền app.omdalat.com không hoàn tất",
      pending: "thanh toán hoặc mở quyền app.omdalat.com còn chờ xác nhận",
      receipt: "thanh toán hoặc mở quyền app.omdalat.com đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho app.omdalat.com đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not complete the billing step for your Om Dalat app workspace yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước thanh toán cho không gian ứng dụng Ôm Đà Lạt của bạn."
        },
        preview: {
          en: "Your Om Dalat App billing action was not completed.",
          vi: "Thao tác thanh toán trên ứng dụng Ôm Đà Lạt của bạn chưa hoàn tất."
        },
        subject: {
          en: "Om Dalat App | Billing action was not completed",
          vi: "Ôm Đà Lạt App | Thao tác thanh toán chưa hoàn tất"
        }
      },
      pending: {
        intro: {
          en: "We recorded a billing action for your Om Dalat app workspace, and the confirmation is still pending.",
          vi: "Chúng tôi đã ghi nhận một thao tác thanh toán cho không gian ứng dụng Ôm Đà Lạt của bạn và hiện vẫn đang chờ xác nhận."
        },
        preview: {
          en: "Your Om Dalat App billing action is pending confirmation.",
          vi: "Thao tác thanh toán trên ứng dụng Ôm Đà Lạt của bạn đang chờ xác nhận."
        },
        subject: {
          en: "Om Dalat App | Billing action is pending confirmation",
          vi: "Ôm Đà Lạt App | Thao tác thanh toán đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed the billing action connected to your Om Dalat app workspace.",
          vi: "Chúng tôi đã xác nhận thao tác thanh toán gắn với không gian ứng dụng Ôm Đà Lạt của bạn."
        },
        preview: {
          en: "Your Om Dalat App billing action has been confirmed.",
          vi: "Thao tác thanh toán trên ứng dụng Ôm Đà Lạt của bạn đã được xác nhận."
        },
        subject: {
          en: "Om Dalat App | Billing receipt #{{invoice_id}}",
          vi: "Ôm Đà Lạt App | Biên nhận thanh toán #{{invoice_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed a refund or adjustment related to your Om Dalat app billing.",
          vi: "Chúng tôi đã xử lý một hoàn tiền hoặc điều chỉnh liên quan đến thanh toán ứng dụng Ôm Đà Lạt của bạn."
        },
        preview: {
          en: "A refund or adjustment was processed for your Om Dalat App billing record.",
          vi: "Một hoàn tiền hoặc điều chỉnh đã được xử lý cho bản ghi thanh toán ứng dụng Ôm Đà Lạt của bạn."
        },
        subject: {
          en: "Om Dalat App | Refund / adjustment update #{{invoice_id}}",
          vi: "Ôm Đà Lạt App | Cập nhật hoàn tiền / điều chỉnh #{{invoice_id}}"
        }
      }
    }
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "IAI Flow",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "flow.iai.one",
    item: {
      label: {
        en: "Plan / workspace",
        vi: "Plan / workspace"
      },
      valueVariable: "{{product_name}}"
    },
    links: billingLinks,
    paymentPack: "PACK_A",
    reference: invoiceReference,
    senderPolicy: createSenderPolicy("flow.iai.one"),
    surfaceClass: "PAYMENT_ACTIVE_OR_CANDIDATE",
    surfaceRole: "AI workflow, agent, and runtime orchestration platform",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "BUILDER_FIRST",
    triggers: {
      failed: "billing hoặc mở plan IAI Flow không hoàn tất",
      pending: "billing hoặc mở plan IAI Flow còn chờ xác nhận",
      receipt: "billing hoặc mở plan IAI Flow đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho IAI Flow đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not complete the payment step for your IAI Flow plan or workspace yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước thanh toán cho plan hoặc workspace IAI Flow của bạn."
        },
        preview: {
          en: "Your IAI Flow billing action was not completed.",
          vi: "Thao tác billing trên IAI Flow của bạn chưa hoàn tất."
        },
        subject: {
          en: "IAI Flow | Billing action was not completed",
          vi: "IAI Flow | Thao tác billing chưa hoàn tất"
        }
      },
      pending: {
        intro: {
          en: "We recorded a billing action for your IAI Flow plan so you can continue building workflows, agents, and runtime orchestration.",
          vi: "Chúng tôi đã ghi nhận một thao tác billing cho plan IAI Flow của bạn để bạn tiếp tục xây workflows, agents và runtime orchestration."
        },
        preview: {
          en: "Your IAI Flow billing action is pending confirmation.",
          vi: "Thao tác billing trên IAI Flow của bạn đang chờ xác nhận."
        },
        subject: {
          en: "IAI Flow | Billing action is pending confirmation",
          vi: "IAI Flow | Thao tác billing đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed the payment connected to your IAI Flow plan or workspace.",
          vi: "Chúng tôi đã xác nhận khoản thanh toán gắn với plan hoặc workspace IAI Flow của bạn."
        },
        preview: {
          en: "Your IAI Flow billing action has been confirmed.",
          vi: "Thao tác billing trên IAI Flow của bạn đã được xác nhận."
        },
        subject: {
          en: "IAI Flow | Billing receipt #{{invoice_id}}",
          vi: "IAI Flow | Biên nhận billing #{{invoice_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed a refund or adjustment related to your IAI Flow billing record.",
          vi: "Chúng tôi đã xử lý một hoàn tiền hoặc điều chỉnh liên quan đến bản ghi billing IAI Flow của bạn."
        },
        preview: {
          en: "A refund or adjustment was processed for your IAI Flow billing record.",
          vi: "Một hoàn tiền hoặc điều chỉnh đã được xử lý cho bản ghi billing IAI Flow của bạn."
        },
        subject: {
          en: "IAI Flow | Refund / adjustment update #{{invoice_id}}",
          vi: "IAI Flow | Cập nhật hoàn tiền / điều chỉnh #{{invoice_id}}"
        }
      }
    }
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "Life IAI One",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "life.iai.one",
    item: {
      label: {
        en: "Path / access",
        vi: "Lộ trình / quyền truy cập"
      },
      valueVariable: "{{product_name}}"
    },
    links: orderLinks,
    paymentPack: "PACK_A",
    reference: orderReference,
    senderPolicy: createSenderPolicy("life.iai.one"),
    surfaceClass: "PAYMENT_ACTIVE_OR_CANDIDATE",
    surfaceRole: "Life system for understanding self, learning correctly, and building verifiable value",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "WARM_HUMAN",
    triggers: {
      failed: "thanh toán mở quyền Life IAI One không hoàn tất",
      pending: "checkout mở quyền Life IAI One còn chờ xác nhận",
      receipt: "thanh toán mở quyền Life IAI One đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho Life IAI One đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not complete the payment step for your Life IAI One access yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước thanh toán cho quyền truy cập Life IAI One của bạn."
        },
        preview: {
          en: "Your Life IAI One access is not complete yet.",
          vi: "Quyền truy cập Life IAI One của bạn chưa hoàn tất."
        },
        subject: {
          en: "Life IAI One | Access payment was not completed for #{{order_id}}",
          vi: "Life IAI One | Thanh toán quyền truy cập chưa hoàn tất cho đơn #{{order_id}}"
        }
      },
      pending: {
        intro: {
          en: "We recorded your request to open access to the Life IAI One learning path, and the provider confirmation is still pending.",
          vi: "Chúng tôi đã ghi nhận yêu cầu mở quyền truy cập lộ trình học của Life IAI One và hiện vẫn đang chờ xác nhận từ provider."
        },
        preview: {
          en: "Your Life IAI One access is pending confirmation.",
          vi: "Quyền truy cập Life IAI One của bạn đang chờ xác nhận."
        },
        subject: {
          en: "Life IAI One | Your access is pending confirmation",
          vi: "Life IAI One | Quyền truy cập của bạn đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed your payment and opened access to the Life IAI One path you selected.",
          vi: "Chúng tôi đã xác nhận thanh toán và mở quyền truy cập cho lộ trình Life IAI One mà bạn đã chọn."
        },
        preview: {
          en: "Your Life IAI One payment has been confirmed.",
          vi: "Thanh toán Life IAI One của bạn đã được xác nhận."
        },
        subject: {
          en: "Life IAI One | Access payment receipt #{{order_id}}",
          vi: "Life IAI One | Biên nhận thanh toán quyền truy cập #{{order_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed a refund or adjustment related to your Life IAI One payment.",
          vi: "Chúng tôi đã xử lý một hoàn tiền hoặc điều chỉnh liên quan đến khoản thanh toán Life IAI One của bạn."
        },
        preview: {
          en: "A refund or adjustment was processed for your Life IAI One payment.",
          vi: "Một hoàn tiền hoặc điều chỉnh đã được xử lý cho khoản thanh toán Life IAI One của bạn."
        },
        subject: {
          en: "Life IAI One | Refund / adjustment update for #{{order_id}}",
          vi: "Life IAI One | Cập nhật hoàn tiền / điều chỉnh cho đơn #{{order_id}}"
        }
      }
    }
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "VC | Về Tương Lai",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "vc.vetuonglai.com",
    item: {
      label: {
        en: "Verification layer / dossier",
        vi: "Lớp / hồ sơ xác minh"
      },
      valueVariable: "{{product_name}}"
    },
    links: orderLinks,
    paymentPack: "TEAM_D_CORE_4",
    reference: orderReference,
    senderPolicy: createSenderPolicy("vc.vetuonglai.com"),
    surfaceClass: "TEAM_D_PREP_SITE",
    surfaceRole: "Independent verification layer for capabilities, products, assets, and projects",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "STRUCTURED_TRUST_FIRST",
    triggers: {
      failed: "thanh toán mở lớp xác minh VC không hoàn tất",
      pending: "checkout mở lớp xác minh VC còn chờ xác nhận",
      receipt: "thanh toán mở lớp xác minh VC đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho lớp xác minh VC đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not complete the payment step for your VC verification access yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước thanh toán cho quyền truy cập lớp xác minh VC của bạn."
        },
        preview: {
          en: "Your VC verification access is not complete yet.",
          vi: "Quyền truy cập lớp xác minh VC của bạn chưa hoàn tất."
        },
        subject: {
          en: "VC | Access payment was not completed for #{{order_id}}",
          vi: "VC | Thanh toán quyền truy cập chưa hoàn tất cho đơn #{{order_id}}"
        }
      },
      pending: {
        intro: {
          en: "We recorded your request to open the VC verification layer, and the provider confirmation is still pending.",
          vi: "Chúng tôi đã ghi nhận yêu cầu mở lớp xác minh VC và hiện vẫn đang chờ xác nhận từ provider."
        },
        preview: {
          en: "Your VC verification access is pending confirmation.",
          vi: "Quyền truy cập lớp xác minh VC của bạn đang chờ xác nhận."
        },
        subject: {
          en: "VC | Verification access is pending confirmation",
          vi: "VC | Quyền truy cập xác minh đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed your payment for the VC verification layer you selected.",
          vi: "Chúng tôi đã xác nhận thanh toán cho lớp xác minh VC mà bạn đã chọn."
        },
        preview: {
          en: "Your VC verification payment has been confirmed.",
          vi: "Thanh toán mở lớp xác minh VC của bạn đã được xác nhận."
        },
        subject: {
          en: "VC | Verification access receipt #{{order_id}}",
          vi: "VC | Biên nhận mở lớp xác minh #{{order_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed a refund or adjustment related to your VC verification payment.",
          vi: "Chúng tôi đã xử lý một hoàn tiền hoặc điều chỉnh liên quan đến khoản thanh toán xác minh VC của bạn."
        },
        preview: {
          en: "A refund or adjustment was processed for your VC payment.",
          vi: "Một hoàn tiền hoặc điều chỉnh đã được xử lý cho khoản thanh toán VC của bạn."
        },
        subject: {
          en: "VC | Refund / adjustment update for #{{order_id}}",
          vi: "VC | Cập nhật hoàn tiền / điều chỉnh cho đơn #{{order_id}}"
        }
      }
    }
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "INVEST | Về Tương Lai",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "invest.vetuonglai.com",
    item: {
      label: {
        en: "Investing layer / checklist",
        vi: "Lớp / checklist đầu tư"
      },
      valueVariable: "{{product_name}}"
    },
    links: orderLinks,
    paymentPack: "TEAM_D_CORE_4",
    reference: orderReference,
    senderPolicy: createSenderPolicy("invest.vetuonglai.com"),
    surfaceClass: "TEAM_D_PREP_SITE",
    surfaceRole: "Risk-first investing layer for due diligence and allocation discipline",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "STRUCTURED_TRUST_FIRST",
    triggers: {
      failed: "thanh toán mở lớp đầu tư INVEST không hoàn tất",
      pending: "checkout mở lớp đầu tư INVEST còn chờ xác nhận",
      receipt: "thanh toán mở lớp đầu tư INVEST đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho lớp đầu tư INVEST đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not complete the payment step for your INVEST access yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước thanh toán cho quyền truy cập lớp INVEST của bạn."
        },
        preview: {
          en: "Your INVEST access is not complete yet.",
          vi: "Quyền truy cập lớp INVEST của bạn chưa hoàn tất."
        },
        subject: {
          en: "INVEST | Access payment was not completed for #{{order_id}}",
          vi: "INVEST | Thanh toán quyền truy cập chưa hoàn tất cho đơn #{{order_id}}"
        }
      },
      pending: {
        intro: {
          en: "We recorded your request to open the INVEST layer built on risk awareness and due diligence, and the provider confirmation is still pending.",
          vi: "Chúng tôi đã ghi nhận yêu cầu mở lớp INVEST được xây trên tư duy rủi ro trước và tự thẩm định, và hiện vẫn đang chờ xác nhận từ provider."
        },
        preview: {
          en: "Your INVEST access is pending confirmation.",
          vi: "Quyền truy cập lớp INVEST của bạn đang chờ xác nhận."
        },
        subject: {
          en: "INVEST | Access is pending confirmation",
          vi: "INVEST | Quyền truy cập đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed your payment for the INVEST access you selected.",
          vi: "Chúng tôi đã xác nhận thanh toán cho quyền truy cập lớp INVEST mà bạn đã chọn."
        },
        preview: {
          en: "Your INVEST payment has been confirmed.",
          vi: "Thanh toán mở lớp INVEST của bạn đã được xác nhận."
        },
        subject: {
          en: "INVEST | Access payment receipt #{{order_id}}",
          vi: "INVEST | Biên nhận thanh toán quyền truy cập #{{order_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed a refund or adjustment related to your INVEST payment.",
          vi: "Chúng tôi đã xử lý một hoàn tiền hoặc điều chỉnh liên quan đến khoản thanh toán INVEST của bạn."
        },
        preview: {
          en: "A refund or adjustment was processed for your INVEST payment.",
          vi: "Một hoàn tiền hoặc điều chỉnh đã được xử lý cho khoản thanh toán INVEST của bạn."
        },
        subject: {
          en: "INVEST | Refund / adjustment update for #{{order_id}}",
          vi: "INVEST | Cập nhật hoàn tiền / điều chỉnh cho đơn #{{order_id}}"
        }
      }
    }
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "LIFE | Về Tương Lai",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "life.vetuonglai.com",
    item: {
      label: {
        en: "Rhythm layer / access",
        vi: "Lớp / nhịp sống"
      },
      valueVariable: "{{product_name}}"
    },
    links: orderLinks,
    paymentPack: "TEAM_D_CORE_4",
    reference: orderReference,
    senderPolicy: createSenderPolicy("life.vetuonglai.com"),
    surfaceClass: "TEAM_D_PREP_SITE",
    surfaceRole: "Life layer for stabilizing rhythm, energy, and review discipline",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "WARM_HUMAN",
    triggers: {
      failed: "thanh toán mở lớp LIFE không hoàn tất",
      pending: "checkout mở lớp LIFE còn chờ xác nhận",
      receipt: "thanh toán mở lớp LIFE đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho lớp LIFE đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not complete the payment step for your LIFE access yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước thanh toán cho quyền truy cập lớp LIFE của bạn."
        },
        preview: {
          en: "Your LIFE access is not complete yet.",
          vi: "Quyền truy cập lớp LIFE của bạn chưa hoàn tất."
        },
        subject: {
          en: "LIFE | Access payment was not completed for #{{order_id}}",
          vi: "LIFE | Thanh toán quyền truy cập chưa hoàn tất cho đơn #{{order_id}}"
        }
      },
      pending: {
        intro: {
          en: "We recorded your request to open the LIFE layer focused on rhythm, energy, and weekly review, and the provider confirmation is still pending.",
          vi: "Chúng tôi đã ghi nhận yêu cầu mở lớp LIFE tập trung vào nhịp sống, năng lượng và review tuần, và hiện vẫn đang chờ xác nhận từ provider."
        },
        preview: {
          en: "Your LIFE access is pending confirmation.",
          vi: "Quyền truy cập lớp LIFE của bạn đang chờ xác nhận."
        },
        subject: {
          en: "LIFE | Access is pending confirmation",
          vi: "LIFE | Quyền truy cập đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed your payment for the LIFE access you selected.",
          vi: "Chúng tôi đã xác nhận thanh toán cho quyền truy cập lớp LIFE mà bạn đã chọn."
        },
        preview: {
          en: "Your LIFE payment has been confirmed.",
          vi: "Thanh toán mở lớp LIFE của bạn đã được xác nhận."
        },
        subject: {
          en: "LIFE | Access payment receipt #{{order_id}}",
          vi: "LIFE | Biên nhận thanh toán quyền truy cập #{{order_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed a refund or adjustment related to your LIFE payment.",
          vi: "Chúng tôi đã xử lý một hoàn tiền hoặc điều chỉnh liên quan đến khoản thanh toán LIFE của bạn."
        },
        preview: {
          en: "A refund or adjustment was processed for your LIFE payment.",
          vi: "Một hoàn tiền hoặc điều chỉnh đã được xử lý cho khoản thanh toán LIFE của bạn."
        },
        subject: {
          en: "LIFE | Refund / adjustment update for #{{order_id}}",
          vi: "LIFE | Cập nhật hoàn tiền / điều chỉnh cho đơn #{{order_id}}"
        }
      }
    }
  },
  {
    allowedLocales: ["en", "vi"],
    brandName: "AI Accounting Loop",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "en",
    domain: "aiaccountingloop.com",
    item: {
      label: {
        en: "Workspace / plan",
        vi: "Workspace / gói"
      },
      valueVariable: "{{workspace_name}}"
    },
    links: billingLinks,
    paymentPack: "PACK_B",
    reference: invoiceReference,
    senderPolicy: createSenderPolicy("aiaccountingloop.com"),
    surfaceClass: "TEAM_D_PREP_SITE",
    surfaceRole: "Accounting workspace for bookkeeping, reconciliation, reporting, and compliance",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "RUNTIME_BILLING",
    triggers: {
      failed: "billing hoặc thu phí workspace AI Accounting Loop không hoàn tất",
      pending: "billing hoặc thu phí workspace AI Accounting Loop còn chờ xác nhận",
      receipt: "billing hoặc thu phí workspace AI Accounting Loop đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho billing AI Accounting Loop đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not complete the billing step for your AI Accounting Loop workspace yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước billing cho workspace AI Accounting Loop của bạn."
        },
        preview: {
          en: "Your AI Accounting Loop billing action was not completed.",
          vi: "Thao tác billing trên AI Accounting Loop của bạn chưa hoàn tất."
        },
        subject: {
          en: "AI Accounting Loop | Billing action was not completed",
          vi: "AI Accounting Loop | Thao tác billing chưa hoàn tất"
        }
      },
      pending: {
        intro: {
          en: "We recorded a billing action for your AI Accounting Loop workspace covering accounting, reconciliation, reporting, or compliance work, and the confirmation is still pending.",
          vi: "Chúng tôi đã ghi nhận một thao tác billing cho workspace AI Accounting Loop của bạn liên quan tới accounting, reconciliation, reporting hoặc compliance, và hiện vẫn đang chờ xác nhận."
        },
        preview: {
          en: "Your AI Accounting Loop billing action is pending confirmation.",
          vi: "Thao tác billing trên AI Accounting Loop của bạn đang chờ xác nhận."
        },
        subject: {
          en: "AI Accounting Loop | Billing action is pending confirmation",
          vi: "AI Accounting Loop | Thao tác billing đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed the billing action connected to your AI Accounting Loop workspace.",
          vi: "Chúng tôi đã xác nhận thao tác billing gắn với workspace AI Accounting Loop của bạn."
        },
        preview: {
          en: "Your AI Accounting Loop billing action has been confirmed.",
          vi: "Thao tác billing trên AI Accounting Loop của bạn đã được xác nhận."
        },
        subject: {
          en: "AI Accounting Loop | Billing receipt #{{invoice_id}}",
          vi: "AI Accounting Loop | Biên nhận billing #{{invoice_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed a refund or adjustment related to your AI Accounting Loop billing record.",
          vi: "Chúng tôi đã xử lý một hoàn tiền hoặc điều chỉnh liên quan đến bản ghi billing AI Accounting Loop của bạn."
        },
        preview: {
          en: "A refund or adjustment was processed for your AI Accounting Loop billing record.",
          vi: "Một hoàn tiền hoặc điều chỉnh đã được xử lý cho bản ghi billing AI Accounting Loop của bạn."
        },
        subject: {
          en: "AI Accounting Loop | Refund / adjustment update #{{invoice_id}}",
          vi: "AI Accounting Loop | Cập nhật hoàn tiền / điều chỉnh #{{invoice_id}}"
        }
      }
    }
  },
  {
    allowedLocales: ["en", "vi", "ko", "zh", "ja", "fr", "es"],
    brandName: "Tramsaigon",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "en",
    domain: "tramsaigon.com",
    item: {
      label: {
        en: "Membership / creator pack",
        vi: "Thành viên / creator pack"
      },
      valueVariable: "{{product_name}}"
    },
    links: orderLinks,
    paymentPack: "TEAM_D_CORE_4",
    reference: orderReference,
    senderPolicy: createSenderPolicy("tramsaigon.com"),
    surfaceClass: "TEAM_D_PREP_SITE",
    surfaceRole: "Multilingual city platform for membership, creator value, and business discovery",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "COMMERCE_GROWTH_TRUST_FIRST",
    triggers: {
      failed: "thanh toán membership hoặc creator pack Tramsaigon không hoàn tất",
      pending: "checkout membership hoặc creator pack Tramsaigon còn chờ xác nhận",
      receipt: "thanh toán membership hoặc creator pack Tramsaigon đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho membership hoặc creator pack Tramsaigon đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not complete the payment step for your Tramsaigon membership or creator access yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước thanh toán cho quyền thành viên hoặc creator access trên Tramsaigon của bạn."
        },
        preview: {
          en: "Your Tramsaigon access was not completed yet.",
          vi: "Quyền truy cập Tramsaigon của bạn chưa được hoàn tất."
        },
        subject: {
          en: "Tramsaigon | Payment was not completed for #{{order_id}}",
          vi: "Tramsaigon | Thanh toán chưa hoàn tất cho đơn #{{order_id}}"
        }
      },
      pending: {
        intro: {
          en: "We recorded your request for deeper Tramsaigon access, whether for membership insight or creator participation, and the confirmation is still pending.",
          vi: "Chúng tôi đã ghi nhận yêu cầu mở quyền truy cập sâu hơn trên Tramsaigon, dù là cho membership insight hay creator participation, và hiện vẫn đang chờ xác nhận."
        },
        preview: {
          en: "Your Tramsaigon payment is pending confirmation.",
          vi: "Thanh toán Tramsaigon của bạn đang chờ xác nhận."
        },
        subject: {
          en: "Tramsaigon | Your payment is pending confirmation",
          vi: "Tramsaigon | Thanh toán của bạn đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed your payment for the Tramsaigon access you selected.",
          vi: "Chúng tôi đã xác nhận thanh toán cho quyền truy cập Tramsaigon mà bạn đã chọn."
        },
        preview: {
          en: "Your Tramsaigon payment has been confirmed.",
          vi: "Thanh toán Tramsaigon của bạn đã được xác nhận."
        },
        subject: {
          en: "Tramsaigon | Payment receipt #{{order_id}}",
          vi: "Tramsaigon | Biên nhận thanh toán #{{order_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed a refund or adjustment related to your Tramsaigon payment.",
          vi: "Chúng tôi đã xử lý một hoàn tiền hoặc điều chỉnh liên quan đến khoản thanh toán Tramsaigon của bạn."
        },
        preview: {
          en: "A refund or adjustment was processed for your Tramsaigon payment.",
          vi: "Một hoàn tiền hoặc điều chỉnh đã được xử lý cho khoản thanh toán Tramsaigon của bạn."
        },
        subject: {
          en: "Tramsaigon | Refund / adjustment update for #{{order_id}}",
          vi: "Tramsaigon | Cập nhật hoàn tiền / điều chỉnh cho đơn #{{order_id}}"
        }
      }
    }
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "App IAI One",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "app.iai.one",
    item: {
      label: {
        en: "Workspace / plan",
        vi: "Workspace / gói"
      },
      valueVariable: "{{workspace_name}}"
    },
    links: billingLinks,
    paymentPack: "PACK_A",
    reference: invoiceReference,
    senderPolicy: createSenderPolicy("app.iai.one"),
    surfaceClass: "PAYMENT_ACTIVE_OR_CANDIDATE",
    surfaceRole: "Website control center for creation, editing, preview, and publishing",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "ACCOUNT_CENTRIC",
    triggers: {
      failed: "billing hoặc thu phí workspace App IAI One không hoàn tất",
      pending: "billing hoặc thu phí workspace App IAI One còn chờ xác nhận",
      receipt: "billing hoặc thu phí workspace App IAI One đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho App IAI One đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not complete the billing step for your App IAI One workspace yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước billing cho workspace App IAI One của bạn."
        },
        preview: {
          en: "Your App IAI One billing action was not completed.",
          vi: "Thao tác billing trên App IAI One của bạn chưa hoàn tất."
        },
        subject: {
          en: "App IAI One | Billing action was not completed",
          vi: "App IAI One | Thao tác billing chưa hoàn tất"
        }
      },
      pending: {
        intro: {
          en: "We recorded a billing action for your App IAI One workspace, and the confirmation is still pending.",
          vi: "Chúng tôi đã ghi nhận một thao tác billing cho workspace App IAI One của bạn và hiện vẫn đang chờ xác nhận."
        },
        preview: {
          en: "Your App IAI One billing action is pending confirmation.",
          vi: "Thao tác billing trên App IAI One của bạn đang chờ xác nhận."
        },
        subject: {
          en: "App IAI One | Billing action is pending confirmation",
          vi: "App IAI One | Thao tác billing đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed the billing action connected to your App IAI One workspace.",
          vi: "Chúng tôi đã xác nhận thao tác billing gắn với workspace App IAI One của bạn."
        },
        preview: {
          en: "Your App IAI One billing action has been confirmed.",
          vi: "Thao tác billing trên App IAI One của bạn đã được xác nhận."
        },
        subject: {
          en: "App IAI One | Billing receipt #{{invoice_id}}",
          vi: "App IAI One | Biên nhận billing #{{invoice_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed a refund or adjustment related to your App IAI One billing record.",
          vi: "Chúng tôi đã xử lý một hoàn tiền hoặc điều chỉnh liên quan đến bản ghi billing App IAI One của bạn."
        },
        preview: {
          en: "A refund or adjustment was processed for your App IAI One billing record.",
          vi: "Một hoàn tiền hoặc điều chỉnh đã được xử lý cho bản ghi billing App IAI One của bạn."
        },
        subject: {
          en: "App IAI One | Refund / adjustment update #{{invoice_id}}",
          vi: "App IAI One | Cập nhật hoàn tiền / điều chỉnh #{{invoice_id}}"
        }
      }
    }
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "NOOS",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "noos.iai.one",
    item: {
      label: {
        en: "Operating layer / access",
        vi: "Lớp vận hành / quyền truy cập"
      },
      valueVariable: "{{product_name}}"
    },
    links: orderLinks,
    paymentPack: "PACK_A",
    reference: orderReference,
    senderPolicy: createSenderPolicy("noos.iai.one"),
    surfaceClass: "PAYMENT_ACTIVE_OR_CANDIDATE",
    surfaceRole: "Civilization operating system and trusted coordination architecture",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "STRUCTURED_TRUST_FIRST",
    triggers: {
      failed: "thanh toán mở quyền NOOS không hoàn tất",
      pending: "checkout mở quyền NOOS còn chờ xác nhận",
      receipt: "thanh toán mở quyền NOOS đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho NOOS đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not complete the payment step for your NOOS access yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước thanh toán cho quyền truy cập NOOS của bạn."
        },
        preview: {
          en: "Your NOOS access is not complete yet.",
          vi: "Quyền truy cập NOOS của bạn chưa hoàn tất."
        },
        subject: {
          en: "NOOS | Access payment was not completed for #{{order_id}}",
          vi: "NOOS | Thanh toán quyền truy cập chưa hoàn tất cho đơn #{{order_id}}"
        }
      },
      pending: {
        intro: {
          en: "We recorded your request to open a NOOS operating layer or documentation access lane, and the confirmation is still pending.",
          vi: "Chúng tôi đã ghi nhận yêu cầu mở một lớp vận hành hoặc lane truy cập tài liệu trên NOOS, và hiện vẫn đang chờ xác nhận."
        },
        preview: {
          en: "Your NOOS access is pending confirmation.",
          vi: "Quyền truy cập NOOS của bạn đang chờ xác nhận."
        },
        subject: {
          en: "NOOS | Access is pending confirmation",
          vi: "NOOS | Quyền truy cập đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed your payment for the NOOS access you selected.",
          vi: "Chúng tôi đã xác nhận thanh toán cho quyền truy cập NOOS mà bạn đã chọn."
        },
        preview: {
          en: "Your NOOS payment has been confirmed.",
          vi: "Thanh toán NOOS của bạn đã được xác nhận."
        },
        subject: {
          en: "NOOS | Access payment receipt #{{order_id}}",
          vi: "NOOS | Biên nhận thanh toán quyền truy cập #{{order_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed a refund or adjustment related to your NOOS payment.",
          vi: "Chúng tôi đã xử lý một hoàn tiền hoặc điều chỉnh liên quan đến khoản thanh toán NOOS của bạn."
        },
        preview: {
          en: "A refund or adjustment was processed for your NOOS payment.",
          vi: "Một hoàn tiền hoặc điều chỉnh đã được xử lý cho khoản thanh toán NOOS của bạn."
        },
        subject: {
          en: "NOOS | Refund / adjustment update for #{{order_id}}",
          vi: "NOOS | Cập nhật hoàn tiền / điều chỉnh cho đơn #{{order_id}}"
        }
      }
    }
  },
  {
    allowedLocales: ["en", "vi"],
    brandName: "CIOS",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "en",
    domain: "cios.iai.one",
    item: {
      label: {
        en: "Plan / service",
        vi: "Gói / dịch vụ"
      },
      valueVariable: "{{product_name}}"
    },
    links: billingLinks,
    paymentPack: "PACK_C",
    reference: invoiceReference,
    senderPolicy: createSenderPolicy("cios.iai.one"),
    surfaceClass: "PAYMENT_ACTIVE_OR_CANDIDATE",
    surfaceRole: "Enterprise intelligence product with formal billing and governance expectations",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "ENTERPRISE_FORMAL",
    triggers: {
      failed: "billing hoặc thanh toán CIOS không hoàn tất",
      pending: "billing hoặc thanh toán CIOS còn chờ xác nhận",
      receipt: "billing hoặc thanh toán CIOS đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho CIOS đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not complete the billing step for your CIOS plan or service yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước billing cho gói hoặc dịch vụ CIOS của bạn."
        },
        preview: {
          en: "Your CIOS billing action was not completed.",
          vi: "Thao tác billing CIOS của bạn chưa hoàn tất."
        },
        subject: {
          en: "CIOS | Billing action was not completed",
          vi: "CIOS | Thao tác billing chưa hoàn tất"
        }
      },
      pending: {
        intro: {
          en: "We recorded a billing action for your CIOS plan or service, and the confirmation is still pending.",
          vi: "Chúng tôi đã ghi nhận một thao tác billing cho gói hoặc dịch vụ CIOS của bạn và hiện vẫn đang chờ xác nhận."
        },
        preview: {
          en: "Your CIOS billing action is pending confirmation.",
          vi: "Thao tác billing CIOS của bạn đang chờ xác nhận."
        },
        subject: {
          en: "CIOS | Billing action is pending confirmation",
          vi: "CIOS | Thao tác billing đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed the billing action connected to your CIOS plan or service.",
          vi: "Chúng tôi đã xác nhận thao tác billing gắn với gói hoặc dịch vụ CIOS của bạn."
        },
        preview: {
          en: "Your CIOS billing action has been confirmed.",
          vi: "Thao tác billing CIOS của bạn đã được xác nhận."
        },
        subject: {
          en: "CIOS | Billing receipt #{{invoice_id}}",
          vi: "CIOS | Biên nhận billing #{{invoice_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed a refund or adjustment related to your CIOS billing record.",
          vi: "Chúng tôi đã xử lý một hoàn tiền hoặc điều chỉnh liên quan đến bản ghi billing CIOS của bạn."
        },
        preview: {
          en: "A refund or adjustment was processed for your CIOS billing record.",
          vi: "Một hoàn tiền hoặc điều chỉnh đã được xử lý cho bản ghi billing CIOS của bạn."
        },
        subject: {
          en: "CIOS | Refund / adjustment update #{{invoice_id}}",
          vi: "CIOS | Cập nhật hoàn tiền / điều chỉnh #{{invoice_id}}"
        }
      }
    }
  },
  {
    allowedLocales: ["vi", "en"],
    brandName: "Làm Việc | Muôn Nơi",
    customerFacingPaymentEmailAllowed: true,
    defaultLocale: "vi",
    domain: "lamviec.muonnoi.org",
    item: {
      label: {
        en: "Workspace / operating access",
        vi: "Workspace / quyền vận hành"
      },
      valueVariable: "{{workspace_name}}"
    },
    links: billingLinks,
    paymentPack: "PACK_B",
    reference: invoiceReference,
    senderPolicy: createSenderPolicy("lamviec.muonnoi.org"),
    surfaceClass: "TEAM_D_PREP_SITE",
    surfaceRole: "Operating gateway for signals, interventions, workflows, and audited reports",
    templateScope: "TEAM_D_CORE_PAYMENT_SET",
    toneMode: "RUNTIME_BILLING",
    triggers: {
      failed: "billing hoặc mở quyền vận hành Làm Việc | Muôn Nơi không hoàn tất",
      pending: "billing hoặc mở quyền vận hành Làm Việc | Muôn Nơi còn chờ xác nhận",
      receipt: "billing hoặc mở quyền vận hành Làm Việc | Muôn Nơi đã được xác nhận",
      refund: "hoàn tiền hoặc điều chỉnh cho Làm Việc | Muôn Nơi đã được xử lý"
    },
    copy: {
      failed: {
        intro: {
          en: "We could not complete the billing step for your Muôn Nơi operating workspace yet.",
          vi: "Chúng tôi chưa thể hoàn tất bước billing cho workspace vận hành Muôn Nơi của bạn."
        },
        preview: {
          en: "Your Muôn Nơi operating billing action was not completed.",
          vi: "Thao tác billing cho workspace vận hành Muôn Nơi của bạn chưa hoàn tất."
        },
        subject: {
          en: "Làm Việc | Muôn Nơi | Billing action was not completed",
          vi: "Làm Việc | Muôn Nơi | Thao tác billing chưa hoàn tất"
        }
      },
      pending: {
        intro: {
          en: "We recorded a billing action for your Muôn Nơi operating workspace, and the confirmation is still pending.",
          vi: "Chúng tôi đã ghi nhận một thao tác billing cho workspace vận hành Muôn Nơi của bạn và hiện vẫn đang chờ xác nhận."
        },
        preview: {
          en: "Your Muôn Nơi operating billing action is pending confirmation.",
          vi: "Thao tác billing cho workspace vận hành Muôn Nơi của bạn đang chờ xác nhận."
        },
        subject: {
          en: "Làm Việc | Muôn Nơi | Billing action is pending confirmation",
          vi: "Làm Việc | Muôn Nơi | Thao tác billing đang chờ xác nhận"
        }
      },
      receipt: {
        intro: {
          en: "We confirmed the billing action connected to your Muôn Nơi operating workspace.",
          vi: "Chúng tôi đã xác nhận thao tác billing gắn với workspace vận hành Muôn Nơi của bạn."
        },
        preview: {
          en: "Your Muôn Nơi operating billing action has been confirmed.",
          vi: "Thao tác billing cho workspace vận hành Muôn Nơi của bạn đã được xác nhận."
        },
        subject: {
          en: "Làm Việc | Muôn Nơi | Billing receipt #{{invoice_id}}",
          vi: "Làm Việc | Muôn Nơi | Biên nhận billing #{{invoice_id}}"
        }
      },
      refund: {
        intro: {
          en: "We processed a refund or adjustment related to your Muôn Nơi operating billing record.",
          vi: "Chúng tôi đã xử lý một hoàn tiền hoặc điều chỉnh liên quan đến bản ghi billing cho workspace vận hành Muôn Nơi của bạn."
        },
        preview: {
          en: "A refund or adjustment was processed for your Muôn Nơi operating billing record.",
          vi: "Một hoàn tiền hoặc điều chỉnh đã được xử lý cho bản ghi billing của workspace vận hành Muôn Nơi."
        },
        subject: {
          en: "Làm Việc | Muôn Nơi | Refund / adjustment update #{{invoice_id}}",
          vi: "Làm Việc | Muôn Nơi | Cập nhật hoàn tiền / điều chỉnh #{{invoice_id}}"
        }
      }
    }
  }
];

export function getTeamDPaymentEmailProfile(domain: string): TeamDPaymentEmailProfile | null {
  const normalizedDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  return teamDPaymentEmailProfiles.find((profile) => profile.domain === normalizedDomain) ?? null;
}
