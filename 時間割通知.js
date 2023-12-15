function myFunction() {
    const token = ''; //LINE Notifyで発行されるトークンを定数tokenとして宣言
    const lineNotifyApi = 'https://notify-api.line.me/api/notify'; //定数lineNotifyApiとして宣言
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet(); //時間割表のスプレッドシート　定数spreadsheetとして宣言
    const sheet = spreadsheet.getActiveSheet(); //時間割表のシート　定数sheetとして宣言
    const dayArray = ["日", "月", "火", "水", "木", "金", "土"]; //1週間の曜日　定数dayArrayとして宣言
    const values = sheet.getDataRange().getValues(); //sheetにある全データを取得　定数valuesとして宣言
    const today = new Date(); //今日の日付取得　変数todayとして宣言 
    let dayOfWeek = dayArray[today.getDay()]; 	// 今日の曜日(日本語表記)取得　変数dayOfWeek
    let today_toString = (today.getMonth() + 1) + '/' + today.getDate() + '（' + dayOfWeek + '）'; //今日の日付[mm/dd（曜日）]の文字列型 変数today_toStringとして宣言
    if (today.getDate().toString().length == 1) { //日付が1桁の場合
        today_toString = (today.getMonth() + 1) + '/0' + today.getDate() + '（' + dayOfWeek + '）'; //日付の前に0を追加
    }
    let today_cell = sheet.getRange(searchWord(today_toString)); //今日の日付のセルをシート内で検索し取得　変数today_cellとして宣言
    let nextDay = today_cell.getRow(); //今日の日付の行番号を変数nextDayに代入
    let schedule_AM = values[nextDay][1]; //明日の午前中のスケジュールを配列valuesから取得 変数schedule_AMとして宣言
    let nextSchedule = []; //次の講義を取得するための空の配列を準備　変数nextScheduleとして宣言
    if (schedule_AM == 'ハローワーク来所日') { //翌日の午前のスケジュールがハローワーク来所日の場合
        if (today.getDay() == 0) {
            nextSchedule = values[nextDay]; //nextScheduleに次の日のデータをvaluesから取得し代入
        } else {
            nextDay += 1; //nextDayの次の日にするために＋１
            nextSchedule = values[nextDay]; //nextScheduleに次の日のデータをvaluesから取得し代入
        }

        if (nextSchedule[1] == '休み') { //その次の日が休みの場合
            nextSchedule = whileNextSchedule(nextSchedule[1], values, nextDay); //nextScheduleに休み明けのデータを代入
        }
    } else if (schedule_AM == '休み') { //翌日の午前のスケジュールが休みの場合
        nextSchedule = whileNextSchedule(schedule_AM, values, nextDay); //休み明けのデータを代入
    } else {
        nextSchedule = values[nextDay]; //nextScheduleに翌日のスケジュールデータをvaluesから取得し代入
    }
    let message; //変数messageとして宣言
    if (today.getDay() == 0) { //今日が日曜日の場合
        message = '\nお疲れ様です。\n今週の講義は下記のとおりです。\n';
        for (let i = 0; i < 5; i++) { //今週の平日の予定をmessageに代入
            message += '\n' + (values[nextDay + i][0].getMonth() + 1) + '/' + values[nextDay + i][0].getDate() + '(' + dayArray[values[nextDay + i][0].getDay()] + ')' + '\n午前: ' + values[nextDay + i][1] + "\n午後: " + values[nextDay + i][2];
        }
    } else {
        message = '\nお疲れ様です。\n次回の講義は下記のとおりです。\n\n' + (nextSchedule[0].getMonth() + 1) + '/' + nextSchedule[0].getDate() + '(' + dayArray[nextSchedule[0].getDay()] + ')' + '\n午前: ' + nextSchedule[1] + "\n午後: " + nextSchedule[2];
        if (nextSchedule[3] != '') { //次のスケジュールにテストがある場合
            message += '\n\nまた、' + nextSchedule[3] + 'のテストがあります。';
        }
        if (nextSchedule[4] != '') { //次のスケジュールにコメントがある場合
            message += '\n\nなお本日' + today_toString + 'は、\n' + nextSchedule[4] + '\nの1週間前になります。\n一緒に頑張りましょう！';
        }
    }

    const options =
    {
        "method": "post",
        "payload": { "message": message },
        "headers": { "Authorization": "Bearer " + token }
    }; //連想配列の変数optionsとして宣言
    if (values[nextDay - 1][1] == "ハローワーク来所日") {


    } else if (values[nextDay - 1][1] == "ハローワーク来所日" && values[nextDay - 2][1] == "休み") {


    } else if (values[nextDay - 1][1] != "休み" || today.getDay() == 0) { //今日が講義がある日または日曜日の場合

        UrlFetchApp.fetch(lineNotifyApi, options); //Lineに投稿
    }
}

function searchWord(today_toString) { //引数にtoday_toStringを設定 今日の日付のセルを検索しセルの位置を返す
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    let textFinder = sheet.createTextFinder(today_toString);
    let cells = textFinder.findAll();
    return cells[0].getA1Notation();
}

function whileNextSchedule(schedule_AM, values, nextDay) { //休み明けまでスキップし次のスケジュールを返す
    let period = 0;
    let nextSchedule = [];
    while (schedule_AM == '休み') {
        period++;
        schedule_AM = values[nextDay + period][1];
    }
    if (values[nextDay + period][1] == 'ハローワーク来所日') {
        period++;
    }
    nextSchedule = values[nextDay + period];
    return nextSchedule;
}
