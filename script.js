(function(window){

    var Utils = {};

    Utils.dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    Utils.monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    Utils.extend = function(object1){ //jQuery.extend( target [, object1 ] [, objectN ] ) function analogue
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++){
                var object2 = arguments[i];
                if (object2) {
                    for (key in object1) {
                        if (object2[key] !== undefined) {
                            object1[key] = object2[key];
                        }
                    }
                    for (key in object2) {
                        if (object1[key] === undefined) {
                            object1[key] = object2[key];
                        }
                    }
                }
            }
        }
        return object1;
    };

    Utils.isLocalStorageSupported = function(){ //Checking browser support of localStorage
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    };

    Utils.createElementUsingHtml = function(html) { //Use to convert plain HTML to element object (html must have only one root element, otherwise only first will be converted)
        var tmpEl = window.document.createElement('div');
        console.log(tmpEl);
        tmpEl.innerHTML = html;
        //return tmpEl.firstChild;
    };

    Utils.createDomElement = window.document.createElement.bind(window.document);

    Utils.addClass = function(el){
          if (arguments.length > 1) {
              for (var i = 1; i < arguments.length; i++) {
                  el.className += (' ' + arguments[i] + ' ');
              }
          }
    };

    Utils.removeClass = function(el){
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                el.className = el.className.replace(new RegExp(' ' + arguments[i] + ' ', 'g'), '');
            }
        }
    };

    Utils.hasClass = function(el, className){
        return !!~el.className.indexOf(' ' + className + ' ');
    };

    Utils.addEvent = function(el, type, handler){
        if (el.addEventListener) {
            el.addEventListener(type, handler, false);
        } else if (el.attachEvent)  {
            el.attachEvent('on' + type, handler);
        }
    };

    Utils.renderTemplateWithObject = function(templateName, obj){ //Simplest template "engine" ever
        var templateEl = window.document.getElementById(templateName);
        if (templateEl) {
            var templateHtml = templateEl.innerText.trim();
            for (key in obj) {
                var regExp = new RegExp('{{' + key + '}}', 'g');
                templateHtml = templateHtml.replace(regExp, obj[key]);
            }
            templateHtml = templateHtml.replace(/{{([a-z0-9]*)}}/g, '');
            return templateHtml;
        }
        return '';
    };

    //Defining storage, use localStorage if it is available, otherwise use temporal plain object
    var storage = {};
    if (Utils.isLocalStorageSupported()) {
        storage = window.localStorage;
    }

    /*
     BEGIN OF HeadHunterCalendar IMPLEMENTATION
     */

    var HeadHunterCalendar = function(options){
        if (this instanceof HeadHunterCalendar) {

            var currentDate = new Date();
            this.today = {
                date: currentDate.getDate(),
                month: currentDate.getMonth(),
                year: currentDate.getFullYear()
            };

            options = Utils.extend({
                month: this.today.month,
                year: this.today.year,
                daysCount: 35
            }, options);

            if (options.monthYearIndicator) {
                var myi = options.monthYearIndicator;
                if (myi instanceof HTMLElement) {
                    this.monthYearIndicator = myi;
                }
            }
            this.storage = {};
            if (options.storage) {
                this.storage = options.storage;
            }

            this.date = new Date(options.year, options.month, 1);
            this.daysCount = options.daysCount;

            //Create table element
            var tdElements = [];
            var tableEl = Utils.createDomElement('table');
            tableEl.className = 'calendar';
            //Create tbody
            var tbodyEl = Utils.createDomElement('tbody');
            tableEl.appendChild(tbodyEl);
            //Fill with <tr>s and <td>s
            for (var d = 0, trEl; d < this.daysCount; d++) {
                if (!(d % 7)) {
                    trEl = Utils.createDomElement('tr');
                    tbodyEl.appendChild(trEl);
                }
                var tdEl = window.document.createElement('td');
                tdElements.push(tdEl);
                trEl.appendChild(tdEl);
            }

            this.tdElements = tdElements;
            this.tableEl = tableEl;

            this.render(this.storage);

        }
    };

    HeadHunterCalendar.prototype.render = function(data){

        if (!data) {
            data = this.storage;
        }

        if (this.monthYearIndicator) {
            this.monthYearIndicator.innerHTML = this.getMonthYearPorusski(Utils.monthNames);
        }

        var date = new Date(0, 0, 0);
        date.setDate(1);
        date.setMonth(this.date.getMonth());
        date.setFullYear(this.date.getFullYear());
        var day = date.getDay();
        day = ((day == 0) ? 6: day - 1);
        date.setDate(-day);
        var todayTime = new Date(this.today.year, this.today.month, this.today.date).getTime();

        for (var d = 0; d < this.tdElements.length; d++) {

            var tdElement = this.tdElements[d];

            date.setDate(date.getDate() + 1);
            tdElement.hhcDate = new Date(iterateDate.getTime());

            var dayInMonth = tdElement.hhcDate.getDate();
            if (d < 7) {
                dayInMonth = Utils.dayNames[d] + ', ' + dayInMonth;
            }

            var timestampString = '' + tdElement.hhcDate.getTime();
            var recordsRendered = '';
            if (data[timestampString]) {
                var records = JSON.parse(data[timestampString]);
                for (var i = 0; i < records.length; i++){
                    recordsRendered += Utils.renderTemplateWithObject('template-record', records[i]);
                }
            }

            tdElement.className = '';
            tdElement.innerHTML = Utils.renderTemplateWithObject('template-td', {
                day: dayInMonth,
                records: recordsRendered
            });
            if (recordsRendered != '') {
                Utils.addClass(tdElement, 'has-records');
            }

            if (tdElement.hhcDate.getTime() === todayTime) {
                Utils.addClass(tdElement, 'today');
            }
        }

    };

    HeadHunterCalendar.prototype.getTableElement = function(){
        return this.tableEl;
    };

    HeadHunterCalendar.prototype.setMonth = function(month){
        if (this.date.getMonth() != month) {
            this.date.setMonth(month);
            this.render();
        }
    };
    HeadHunterCalendar.prototype.getMonth = function(){
        return this.date.getMonth();
    };
    HeadHunterCalendar.prototype.setYear = function(year){
        if (this.date.getFullYear() != year) {
            this.date.setFullYear(year);
            this.render();
        }
    };
    HeadHunterCalendar.prototype.getYear = function(){
        return this.date.getFullYear();
    };
    HeadHunterCalendar.prototype.setToday = function(){
        this.date.setMonth(this.today.month);
        this.date.setFullYear(this.today.year);
        this.render();
    };

    HeadHunterCalendar.prototype.getMonthYearPorusski = function(names){
        return names[this.date.getMonth()] + ' ' + this.date.getFullYear();
    };

    /*
        END OF HeadHunterCalendar IMPLEMENTATION
     */

    var headHunterCalendar = new HeadHunterCalendar({
        storage: storage,
        monthYearIndicator: document.querySelector('#monthYearIndicator')
    });
    console.log(headHunterCalendar);

    var calendarDiv = window.document.getElementById('calendar-block');
    if (calendarDiv) {
        calendarDiv.innerHTML = '';
        calendarDiv.appendChild(headHunterCalendar.getTableElement());
    }

    var datePickerBtnHandler = function(e){
        e.preventDefault();
        var action = e.target.getAttribute('data-action');
        if (action) {
            switch (action) {
                case 'prev':
                    headHunterCalendar.setMonth(headHunterCalendar.getMonth() - 1);
                    break;
                case 'next':
                    headHunterCalendar.setMonth(headHunterCalendar.getMonth() + 1);
                    break;
                case 'today':
                    headHunterCalendar.setToday();
            }
        }
    };
    var datePickerBtns = window.document.querySelectorAll('.date-picker .btn');
    for (var i = 0; i < datePickerBtns.length; i++) {
        Utils.addEvent(datePickerBtns[i], 'click', datePickerBtnHandler);
    }

})(window);