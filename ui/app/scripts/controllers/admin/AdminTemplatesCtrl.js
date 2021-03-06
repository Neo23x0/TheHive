(function() {
    'use strict';

    angular.module('theHiveControllers').controller('AdminTemplatesCtrl',
        function($scope, $modal, TemplateSrv, AlertSrv, UtilsSrv, ListSrv, MetricsCacheSrv) {
            $scope.task = '';
            $scope.tags = [];
            $scope.templates = [];
            $scope.metrics = [];
            $scope.templateIndex = -1;

            $scope.getMetrics = function() {
                MetricsCacheSrv.all().then(function(metrics){
                    $scope.metrics = metrics;
                });
            };
            $scope.getMetrics();

            $scope.getList = function(index) {
                TemplateSrv.query(function(templates) {
                    $scope.templates = templates;
                    $scope.templateIndex = index;

                    if(templates.length > 0) {
                        $scope.loadTemplate(templates[index].id, $scope.templateIndex);
                    } else {
                        $scope.newTemplate();
                    }
                });
            };
            $scope.getList(0);

            $scope.loadTemplate = function(id, index) {
                TemplateSrv.get({
                    templateId: id
                }, function(template) {
                    delete template.createdAt;
                    delete template.createdBy;
                    delete template.updatedAt;
                    delete template.updatedBy;

                    $scope.template = template;
                    $scope.tags = UtilsSrv.objectify($scope.template.tags, 'text');
                });

                $scope.templateIndex = index;
            };

            $scope.newTemplate = function() {
                $scope.template = {
                    name: '',
                    titlePrefix: '',
                    severity: 2,
                    tlp: 2,
                    tags: [],
                    tasks: [],
                    metricNames: [],
                    description: ''
                };
                $scope.tags = [];
                $scope.templateIndex = -1;
            };

            $scope.removeTask = function(task) {
                $scope.template.tasks = _.without($scope.template.tasks, task);
            };

            $scope.addTask = function() {
                $scope.openTaskDialog({}, 'Add');
            };

            $scope.editTask = function(task) {
                $scope.openTaskDialog(task, 'Update');
            };

            $scope.openTaskDialog = function(task, action) {
                $modal.open({
                    scope: $scope,
                    templateUrl: 'views/partials/admin/templates.task.html',
                    controller: 'AdminTemplateTasksCtrl',
                    size: 'lg',
                    resolve: {
                        action: function() {
                            return action;
                        },
                        task: function() {
                            return task;
                        }
                    }
                });
            };

            $scope.addMetric = function(metric) {
                var metrics = $scope.template.metricNames || [];

                if(metrics.indexOf(metric.name) === -1) {
                    metrics.push(metric.name);
                    $scope.template.metricNames = metrics;
                } else {
                    AlertSrv.log('The metric [' + metric.title + '] has already been added to the template', 'warning');
                }
            };

            $scope.removeMetric = function(metricName) {
                $scope.template.metricNames = _.without($scope.template.metricNames, metricName);
            };

            $scope.deleteTemplate = function() {
                $modal.open({
                    scope: $scope,
                    templateUrl: 'views/partials/admin/templates.delete.html',
                    controller: 'AdminTemplateDeleteCtrl',
                    size: ''
                });
            };

            $scope.saveTemplate = function() {
                $scope.template.tags = _.pluck($scope.tags, 'text');
                if (_.isEmpty($scope.template.id)) {
                    $scope.createTemplate();
                } else {
                    $scope.updateTemplate();
                }
            };

            $scope.createTemplate = function() {
                console.log("Create Template: " + $scope.template.name);
                return TemplateSrv.save($scope.template, function() {
                    $scope.getList(0);
                    AlertSrv.log('The template [' + $scope.template.name + '] has been successfuly created', 'success');
                }, function(response) {
                    AlertSrv.error('TemplateCtrl', response.data, response.status);
                });
            };

            $scope.updateTemplate = function() {
                console.log("Update Template: " + $scope.template.name);
                return TemplateSrv.update({
                    templateId: $scope.template.id
                }, _.omit($scope.template, ['id', 'user', 'type']), function() {
                    $scope.getList($scope.templateIndex);
                    AlertSrv.log('The template [' + $scope.template.name + '] has been successfuly updated', 'success');
                }, function(response) {
                    AlertSrv.error('TemplateCtrl', response.data, response.status);
                });
            };

        })
        .controller('AdminTemplateTasksCtrl', function($scope, $modalInstance, action, task) {
            $scope.task = task || {};
            $scope.action = action;

            $scope.cancel = function() {
                $modalInstance.dismiss();
            };

            $scope.addTask = function() {
                if(action === 'Add') {
                    $scope.template.tasks.push(task);
                }

                $modalInstance.dismiss();
            };
        })
        .controller('AdminTemplateDeleteCtrl', function($scope, $modalInstance, TemplateSrv) {
            $scope.cancel = function() {
                $modalInstance.dismiss();
            };

            $scope.confirm = function() {
                TemplateSrv.delete({
                    templateId: $scope.template.id
                }, function() {
                    $scope.getList(0);
                    $modalInstance.dismiss();
                });
            };
        });
})();
