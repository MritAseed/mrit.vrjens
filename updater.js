const axios = require("axios"); // مكتبة لتحميل الملفات
const fs = require("fs"); // نظام الملفات
const path = require("path"); // التعامل مع المسارات
const { dialog } = require("electron"); // لإظهار رسائل للمستخدم
const { app } = require("electron");

const LOCAL_VERSION_FILE = path.join(app.getAppPath(), "version.json");
const REMOTE_VERSION_URL =
"https://raw.githubusercontent.com/MritAseed/mrit.vrjens/refs/heads/main/version.json";

// ==================
// =="asar": false,==
// ==================

// وظيفة لتنزيل الملفات
async function updateFiles(files) {
  for (const file of files) {
    try {
      const { data } = await axios.get(file.url); // تحميل محتوى الملف
      const localPath = path.join(__dirname, file.path); // تحديد المسار المحلي للملف
      fs.mkdirSync(path.dirname(localPath), { recursive: true }); // إنشاء المجلدات إذا لم تكن موجودة
      fs.writeFileSync(localPath, data, "utf-8"); // كتابة الملف على الجهاز
      console.log(`تم تحديث الملف: ${file.path}`);
    } catch (error) {
      console.error(`فشل تحديث الملف: ${file.path}`, error);
    }
  }
}

async function checkForUpdates() {
  const MAX_RETRIES = 3; // عدد المحاولات لإعادة التحقق
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.log("Checking for updates...");
      const { data: remoteVersion } = await axios.get(REMOTE_VERSION_URL); // تحميل ملف الإصدار البعيد
      const localVersion = JSON.parse(
        fs.readFileSync(LOCAL_VERSION_FILE, "utf-8")
      ); // قراءة ملف الإصدار المحلي

      if (remoteVersion.version !== localVersion.version) {
        // مقارنة رقم الإصدار
        const userResponse = await dialog.showMessageBox({
          type: "info",
          buttons: ["تحديث الآن", "إلغاء"],
          title: "تحديث جديد متوفر",
          message: `يوجد تحديث جديد للإصدار ${remoteVersion.version}.\nهل ترغب في تنزيل التحديث الآن؟`,
        });

        if (userResponse.response === 0) {
          dialog.showMessageBox({
            type: "info",
            title: "جارٍ التنزيل",
            message: "يتم الآن تنزيل الملفات الجديدة...",
          });

          await updateFiles(remoteVersion.files); // تنزيل الملفات وتحديثها
          fs.writeFileSync(
            LOCAL_VERSION_FILE,
            JSON.stringify(remoteVersion, null, 2)
          ); // تحديث ملف الإصدار المحلي

          dialog.showMessageBox({
            type: "info",
            title: "تحديث مكتمل",
            message: "تم تنزيل التحديثات بنجاح! يرجى إعادة تشغيل التطبيق.",
          });
        }
      } else {
        console.log("التطبيق محدث بالفعل.");
        await dialog.showMessageBox({
          type: "info",
          title: "التطبيق محدث",
          message: "التطبيق لديك محدث بالفعل ولا توجد تحديثات جديدة متوفرة.",
        });
      }
      return; // إنهاء الوظيفة عند نجاحها
    } catch (error) {
      retries++;
      console.error(
        `خطأ أثناء التحقق من التحديثات: المحاولة ${retries}/${MAX_RETRIES}`,
        error
      );

      if (retries >= MAX_RETRIES) {
        dialog.showMessageBox({
          type: "error",
          title: "خطأ",
          message: `حدث خطأ أثناء التحقق من التحديثات. يرجى التحقق من اتصال الإنترنت أو المحاولة لاحقاً.\nتفاصيل الخطأ: ${error.message}`,
        });
      }
    }
  }
}

module.exports = { checkForUpdates }; // تصدير الوظيفة

