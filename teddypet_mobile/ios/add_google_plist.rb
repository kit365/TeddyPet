require 'xcodeproj'

project_path = 'Runner.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the Runner target
target = project.targets.find { |t| t.name == 'Runner' }

if target
  # Find or create the Runner group
  group = project.main_group.find_subpath('Runner', true)
  
  # Check if file already exists in group
  file_reference = group.files.find { |f| f.path == 'GoogleService-Info.plist' }
  
  if !file_reference
    # Add file reference to the group
    file_reference = group.new_file('GoogleService-Info.plist')
    puts "Added GoogleService-Info.plist to Runner group."
  else
    puts "GoogleService-Info.plist already exists in Runner group."
  end
  
  # Add file reference to the target's build phase if not already there
  build_phase = target.resources_build_phase
  if !build_phase.files_references.include?(file_reference)
    build_phase.add_file_reference(file_reference)
    puts "Added GoogleService-Info.plist to Runner target resources."
  else
    puts "GoogleService-Info.plist already exists in Runner target resources."
  end
  
  project.save
  puts "Xcode project saved successfully."
else
  puts "Error: Could not find Runner target."
end
