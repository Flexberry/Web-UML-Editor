
  angular.module('umlEditorApp', ['ui.bootstrap','cgNotify']);
  angular.module('umlEditorApp').controller('umlController',
	function ($scope, $http, notify, XMIService){
		  
      notify({
  		        message: "Спасибо, что посетили проект",		            
  		        templateUrl: '',
  		        position: 'left',
  		        classes: '',
  		        duration: 5000
        	  }); 


	    // Инициализируем коллекцию всех моделей диаграммы.
      var graph = new joint.dia.Graph;

      // Инициализируем представление для всех элементов диаграммы.
      var paper = new joint.dia.Paper({
          el: $('#paper'), // Привязываем к конкретному элементу страницы.
          width: 2000, // Задаем ширину области представления.
          height: 2000, // Задаем высоту области представления.
          gridSize: 5, // Задаем размер сетки представления.
          model: graph //Привязываем представление к модели.
      });

      // Инициализируем шаблоны uml.
      var uml = joint.shapes.uml;

      // Инициализируем переменную, которая будет хранить текущий выбранный класс (для последующего его обновления).
      var curClass = {};

      // Инициализируем объект, который будет хранить все классы диаграммы.
      var classes = {};

      // Инициализируем представления для отображения информации о классе в боковом меню.
      $scope.className = {};
      $scope.classMethods = [];
      $scope.classAttributes = [];
      $scope.size = {};

      // Инициализируем переменную для закрытия DOM элементов для работы с классом.
      $scope.showClassProperties = {
      	condition: false,
      	message: "Элемент не выбран"
      };

      // Событие скрола мышки, вызывает функция увеличения/уменьшения масштаба области представления.
      paper.$el.on('mousewheel DOMMouseScroll', onMouseWheel);

      // Функция увеличения/уменьшения масштаба области представления.
      function onMouseWheel(e) {      	
  	    e.preventDefault();
  	    e = e.originalEvent;	    
  	    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))) / 50;

        // OffsetX не определен в FF.
  	    var offsetX = (e.offsetX || e.clientX - $(this).offset().left); 

        // OffsetY не определен в FF.
  	    var offsetY = (e.offsetY || e.clientY - $(this).offset().top); 
  	    var p = offsetToLocalPoint(offsetX, offsetY);

        // Текущий масштаб представления изменяется по дельта.
  	    var newScale = V(paper.viewport).scale().sx + delta; 
  	    if (newScale > 0.4 && newScale < 2) {

            // Сброс предыдущего сдвига.
  	        paper.setOrigin(0, 0); 
  	        paper.scale(newScale, newScale, p.x, p.y);
  	    }

        //Трансформируем точку в систему координат окна просмотра.
  	    function offsetToLocalPoint(x, y) {
  		    var svgPoint = paper.svg.createSVGPoint();
  		    svgPoint.x = x;
  		    svgPoint.y = y;  		    
  		    var pointTransformed = svgPoint.matrixTransform(paper.viewport.getCTM().inverse());
  		    return pointTransformed;
  		  }
	    }

	    // Функция сброса всех условий выбора элементов на создание.
      $scope.refreshConditions = function(){      	
        $scope.classCondition = false;
        $scope.interfaceCondition = false;
        $scope.abstractCondition = false;
        $scope.associationCondition = false;
        $scope.compositionCondition = false;
        $scope.generalizationCondition = false;
        $scope.referenceCondition = false;
        $scope.source = undefined;
        $scope.target = undefined;
      };
      // Вызов функции сброса всех условий выбора элементов на создание.
      $scope.refreshConditions();
      
      // Событие клика на элемент диаграммы.
      paper.on('cell:pointerdown', function(cellView, evt, x, y) {
        // Если мы кликнули по классу (не по связи).        
        if (cellView.model.toJSON().umlType == "Class"){

          // Инициализируем переменную с классом svg элемента, по которому кликнули.
          var svgClass = evt.target.parentNode.getAttribute('class');

          // Открываем боковую панель с названием класса.
          $scope.statusClassNameOpen  = true;

          // Если кликнули на svg элемент удаления класса.
          if (svgClass == 'element-tool-remove') {           
            curClass = cellView.model.toJSON().id;
            $scope.deleteClass();
            $scope.className = {};
            $scope.classMethods = [];
            $scope.classAttributes = [];
            $scope.showClassProperties.condition = false;
            $scope.$apply();
            return;
          }
          // Если кликнули на любую область svg элемента, кроме крестика.
          else {

          // Если перед кликом была выбрана связь, то инициализируем элементы для создания связи.
          if ($scope.referenceCondition == true) {

            // Если это первый элемент для связи, то задаем начало связи.
            if (!$scope.source) {            
              $scope.source = cellView.model.toJSON().id;            
            }
            // Если это не первый элемент для связи, то задаем конец связи.
            else {
              $scope.target = cellView.model.toJSON().id;            
              if ($scope.source != $scope.target) {

                // Switch для создания связей.
                switch (true) {
                  case $scope.associationCondition:

                    // Инициализация связи ассоциация.
                    var assosiation = new uml.Association({
                                                            source: {id: $scope.source}, 
                                                            target: {id: $scope.target},
                                                            labels: [
                                                                      { position: 25, attrs: { text: { text: '*' } } },        
                                                                      { position: -25, attrs: { text: { text: '1' } } }]
                                                          });

                    // Добавляем новую связь к коллекции моделей диаграммы.
                    graph.addCell(assosiation);

                    // Вызов функции сброса всех условий выбора элементов на создание.
                    $scope.refreshConditions();            
                    break;
                  case $scope.compositionCondition:

                    //Инициализация связи композиция.
                    var composition = new uml.Composition({
                                                            source: {id: $scope.source}, 
                                                            target: {id: $scope.target},
                                                            labels: [
                                                                      { position: 25, attrs: { text: { text: '*' } } },        
                                                                      { position: -25, attrs: { text: { text: '1' } } }]
                                                          });

                    // Добавляем новую связь к коллекции моделей диаграммы.
                    graph.addCell(composition);

                    // Вызов функции сброса всех условий выбора элементов на создание.
                    $scope.refreshConditions();            
                    break;
                  case $scope.generalizationCondition:

                    // инициализация связи наследование.
                    var generalization = new uml.Generalization({
                                                                  source: {id: $scope.source}, 
                                                                  target: {id: $scope.target}
                                                                });

                    // Добавляем новую связь к коллекции моделей диаграммы.
                    graph.addCell(generalization);

                    // Вызов функции сброса всех условий выбора элементов на создание.
                    $scope.refreshConditions();            
                    break;
                }                
              }
              else {                
                notify({
                message: "на данный момент такая связь не предусмотрена",               
                templateUrl: '',
                position: 'right',
                classes: "alert-danger",
                duration: 5000
                });                
                // Вызов функции сброса всех условий выбора элементов на создание.
                $scope.refreshConditions();
              }
            }        
          }

          //присваиваем текущий класс        
          curClass = cellView.model.toJSON().id;

          // Инициализируем представления для отображения информации о классе в боковом меню.
          $scope.classMethods = cellView.model.toJSON().methods;
          $scope.classAttributes = cellView.model.toJSON().attributes;
          $scope.className = { 
            name: cellView.model.toJSON().name
          };          
          $scope.size = {
            width: cellView.model.toJSON().size.width,
            height: cellView.model.toJSON().size.height
          };

          // Убираем заглушку на то, что класс не выбран.          
          $scope.showClassProperties.condition = true;

          // Вызываем функцию инициализации типов для бокового меню.            
          typesInit();

          // Обновляем все представления.
          $scope.$apply();

          }
          
        }        
      });      
	  
      // Cобытие клика на пустую область диаграммы.
      paper.on('blank:pointerdown', function(evt, xPosition, yPosition) {
      	
        // Ставим заглушку на то, что класс не выбран.        
      	$scope.showClassProperties.condition = false;
      	
        // Switch для создания класса.      	
        switch (true) {

          // Сase создания класса.
          case $scope.classCondition: 

            // Инициализируем новый uml class из шаблонов с join.uml.           
            var newClass = new uml.Class();

            // Добавляем новый класс в объект с классами.               
            classes[newClass.id] = newClass;

            // Функция инициализации нового класса.          
            classInit(newClass);

            // Вызов функции сброса всех условий выбора элементов на создание.
            $scope.refreshConditions();

            // Открываем боковую панель с названием класса.
            $scope.statusClassNameOpen  = true; 
            break;

          // Сase создания интерфейса.
          case $scope.interfaceCondition:

            // Инициализируем новый uml interface из шаблонов с join.uml.
            var newClass = new uml.Interface();

            //Добавляем новый класс в объект с классами. 
            classes[newClass.id] = newClass;

            //функция инициализации нового класса.  
            classInit(newClass); 

            // Вызов функции сброса всех условий выбора элементов на создание.
            $scope.refreshConditions();

            // Открываем боковую панель с названием класса.
            $scope.statusClassNameOpen = true;
            break;

          // Сase создания абстрактного класса.  
          case $scope.abstractCondition:

            // Инициализируем новый uml interface из шаблонов с join.uml.
            var newClass = new uml.Abstract();

            // Добавляем новый класс в объект с классами. 
            classes[newClass.id] = newClass;

            // Функция инициализации нового класса.   
            classInit(newClass); 

            // Вызов функции сброса всех условий выбора элементов на создание.
            $scope.refreshConditions();

            $scope.statusClassNameOpen  = true;
            break;

          // Сase создания связи (сбрасывает все выбранные ранее условия выбора).
          case $scope.referenceCondition:

            // Вызов функции сброса всех условий выбора элементов на создание.
            $scope.refreshConditions();            
            break;
        }

        function classInit(newClass) {

          //Добавляем необходимые атрибуты классу.         
          classes[newClass.id].attributes.position = { x:xPosition  , y: yPosition};
          classes[newClass.id].attributes.size= { width: 150, height: 100 };
          classes[newClass.id].setClassName("NewClass");
          classes[newClass.id].attributes.attributes = [];
          classes[newClass.id].attributes.methods = [];

          //Добавляем новый класс в коллекция элементов.                   
          graph.addCell(classes[newClass.id]);

          //Присваиваем текущий класс.          
          curClass = newClass.id;

          // Инициалириуем DOM элементы  для работы с классом.
          $scope.showClassProperties.condition = true;   
          $scope.className = {name: "NewClass"};
          $scope.classMethods = [];
          $scope.classAttributes = [];
          typesInit();
          $scope.size = {
            width: "150",
            height: "100"
          }                  
          $scope.$apply();                  
        }                            
      });

	    // Функция инициализирующая типы: types, methodTypes и typesWithClasses.
      function typesInit() {
        $scope.types = [ 
          "String", 
          "Int", 
          "Boolean", 
          "Date",
          "Double",
          "Long",
          "Float",
          "Short"
        ];
        $scope.methodTypes = ["Void"];
        $scope.typesWithClasses = []; 
        _.each($scope.types, function(type) {           
          $scope.typesWithClasses.push(type);
          $scope.methodTypes.push(type);                    
        });
        if (graph.toJSON().cells.length != 0) {
          _.each(graph.toJSON().cells, function(classItem) {
            if (classItem.umlType == "Class"){
              $scope.typesWithClasses.push(classItem.name);
              $scope.methodTypes.push(classItem.name)
            }          
          });
        };     
      };

      // Функция изменения размеров класса.
      $scope.changeSize = function(){           	
      	classes[curClass].resize($scope.size.width, $scope.size.height);      	
      }

      // Функция удаления класса.
      $scope.deleteClass = function() {        
        classes[curClass].remove();             
        delete classes[curClass];       
        $scope.className = {};
        $scope.classMethods = [];
        $scope.classAttributes = [];
        $scope.showClassProperties.condition = false;
                 
      }

      // Функция изменения имени, методов или атрибутов класса.
      $scope.changeClassDetails = function() {
        classes[curClass].setClassName($scope.className.name);        
        updateAttributes(); 
        updateMethods();

      };

      // Функция добавления атрибута.
      $scope.addAtr = function() {
        newAttribute = {
          name: "Newattribute",
          type: null
        };
        $scope.classAttributes.push(newAttribute);        
        updateAttributes();        
      };

      // Функция удаления атрибута.
      $scope.deleteAtr = function(index) {        
        $scope.classAttributes.splice(index, 1);        
        updateAttributes();        
      };

      // Функция добавления метода.
      $scope.addMethod = function(){
        newMethod = {
          name: "NewMethod",
          type: "Void",
          parameters: []
        };
        $scope.classMethods.push(newMethod);                   
        updateMethods();
      };

      // Функция удаления метода.
      $scope.deleteMethod = function(index){              
        $scope.classMethods.splice(index, 1);                
        updateMethods(); 
      }

      // Функция добавления параметра.
      $scope.addParam = function(index) {
        newParam = {
          name: "NewParam",
          type: null
        };
        $scope.classMethods[index].parameters.push(newParam);            
        updateMethods();
      }

      // Функция удаления параметра.
      $scope.deleteParam = function(index, parent) {
        $scope.classMethods[parent.$index].parameters.splice(index, 1);            
        updateMethods();
      }; 

      // Функция обновления арибутов у элемента диаграммы
      function updateAttributes(){
        var attributes = []; 
        classes[curClass].attributes.attributes=$scope.classAttributes;               
        _.each($scope.classAttributes, function(attribute) {
          var attributeString = attribute.name;
          if (attribute.type !=null) {
            attributeString = attributeString + ': ' + attribute.type;
          }
          attributes.push(attributeString);   
        });
        classes[curClass].setAttrs(attributes);
      };
      // функция обновления методов у элемента диаграммы
      function updateMethods(){
        var methods = [];
        classes[curClass].attributes.methods = $scope.classMethods;             
        _.each($scope.classMethods, function(method){
          var parametersString = "";
          if (method.parameters.length != 0){
            for (var i = 0; i < method.parameters.length; i++) {
              if (i == 0){
                parametersString = method.parameters[0].name;
                if (method.parameters[0].type != null){
                  parametersString = parametersString + ': ' + method.parameters[0].type;
                }
              }
              else {
                parametersString = parametersString + ', ' + method.parameters[i].name;
                if (method.parameters[i].type != null){
                  parametersString = parametersString + ': ' + method.parameters[i].type;
                }
              }
            };                
          };                       
          var methodString = method.name + '(' + parametersString +'): ' + method.type;
          methods.push(methodString);   
        });        
        classes[curClass].setMethods(methods);
      };
      // экспорт xmi
	  $scope.exportXMI = function(){
	  	// вызываем сервис XMIService, передаем в него все элементы диаграммы, возвратит XMI в строке
        var content = XMIService.export(graph.toJSON().cells);
        if (content){
          var blob = new Blob([content], { type: 'text/plain' });
          var downloadLink = angular.element('<a></a>');
          downloadLink.attr('href',window.URL.createObjectURL(blob));
          downloadLink.attr('download', 'diagram.xmi');
          downloadLink[0].click();         
          downloadLink = undefined;
        }
      }

	});
	
	
