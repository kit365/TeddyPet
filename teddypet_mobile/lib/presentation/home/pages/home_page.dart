import 'package:flutter/material.dart';
import 'package:teddypet_mobile/presentation/home/widgets/home/story_stats_section.dart';
import 'package:teddypet_mobile/presentation/home/widgets/home/main_footer.dart';
import 'package:teddypet_mobile/presentation/home/widgets/main_header.dart';
import '../widgets/home/hero_section.dart';
import '../widgets/home/category_menu.dart';
import '../widgets/home/services_section.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const MainHeader(),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const CategoryMenu(),

            const HeroSection(),


            const ServicesSection(),


            const StoryStatsSection(),

            const MainFooter(),
          ],
        ),
      ),
    );
  }
}
